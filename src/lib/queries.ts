import { db } from "@/lib/db";
import { isDueToday, isDueThisWeek, isWithinDays } from "@/lib/utils";

const noteInclude = {
  city: { select: { id: true, name: true } },
  contact: { select: { id: true, name: true } },
  tags: { include: { tag: true } },
};

const todoInclude = {
  city: { select: { id: true, name: true } },
  contact: { select: { id: true, name: true } },
  tags: { include: { tag: true } },
  images: { orderBy: { createdAt: "asc" as const } },
};

export async function getCities() {
  const cities = await db.city.findMany({
    include: {
      leaderContact: { select: { id: true, name: true } },
      issues: {
        where: { status: "open" },
        select: { id: true, type: true, content: true },
      },
      _count: {
        select: {
          todos: { where: { progress: { not: "done" } } },
          contacts: true,
        },
      },
    },
  });

  return cities
    .map((city) => ({
      ...city,
      activeTodos: city._count.todos,
      activityScore: city._count.todos + city.issues.length,
    }))
    .sort((a, b) => {
      if (b.activityScore !== a.activityScore) {
        return b.activityScore - a.activityScore;
      }
      return a.name.localeCompare(b.name, "zh-CN");
    });
}

async function migrateLegacyCityIssues(cityId: string) {
  const city = await db.city.findUnique({ where: { id: cityId } });
  if (!city) return;

  const issueCount = await db.cityIssue.count({ where: { cityId } });
  if (issueCount > 0) return;

  const creates = [];
  if (city.teamIssues?.trim()) {
    for (const line of city.teamIssues.split("\n").map((s) => s.trim()).filter(Boolean)) {
      creates.push({ cityId, type: "team", content: line });
    }
  }
  if (city.businessIssues?.trim()) {
    for (const line of city.businessIssues.split("\n").map((s) => s.trim()).filter(Boolean)) {
      creates.push({ cityId, type: "business", content: line });
    }
  }

  if (creates.length) {
    await db.cityIssue.createMany({ data: creates });
    await db.city.update({
      where: { id: cityId },
      data: { teamIssues: null, businessIssues: null },
    });
  }
}

export async function getCityById(id: string) {
  await migrateLegacyCityIssues(id);

  return db.city.findUnique({
    where: { id },
    include: {
      leaderContact: true,
      issues: {
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      },
      contacts: {
        orderBy: { updatedAt: "desc" },
      },
      todos: {
        where: { progress: { not: "done" } },
        orderBy: [{ followUpDate: "asc" }, { updatedAt: "desc" }],
        include: todoInclude,
      },
      notes_rel: {
        orderBy: { updatedAt: "desc" },
        include: noteInclude,
      },
    },
  });
}

export async function getContacts() {
  return db.contact.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      city: { select: { id: true, name: true } },
      _count: { select: { todos: true, notes_rel: true } },
      notes_rel: {
        orderBy: { updatedAt: "desc" },
        take: 3,
        include: noteInclude,
      },
    },
  });
}

export async function getTodos(filters?: {
  scope?: string;
  view?: string;
  cityId?: string;
}) {
  const where: {
    scope?: string;
    cityId?: string | null;
    progress?: { not: string } | string;
    followUpDate?: { lte: Date };
    OR?: Array<Record<string, unknown>>;
  } = {};

  if (filters?.scope) {
    where.scope = filters.scope;
  }

  if (filters?.cityId) {
    where.cityId = filters.cityId;
  }

  if (filters?.view === "today") {
    where.progress = { not: "done" };
    const todos = await db.todo.findMany({
      where,
      include: todoInclude,
      orderBy: [{ followUpDate: "asc" }, { updatedAt: "desc" }],
    });
    return todos.filter(
      (todo) =>
        (todo.followUpDate && isDueToday(todo.followUpDate)) ||
        todo.progress === "waiting" ||
        todo.progress === "in_progress",
    );
  }

  if (filters?.view === "week") {
    where.progress = { not: "done" };
    const todos = await db.todo.findMany({
      where,
      include: todoInclude,
      orderBy: [{ followUpDate: "asc" }, { updatedAt: "desc" }],
    });
    return todos.filter(
      (todo) => todo.followUpDate && isDueThisWeek(todo.followUpDate),
    );
  }

  if (filters?.view === "global") {
    where.scope = "work";
    where.cityId = null;
  }

  if (filters?.view === "personal") {
    where.scope = "personal";
  }

  if (filters?.view === "active") {
    where.progress = { not: "done" };
  }

  return db.todo.findMany({
    where,
    include: todoInclude,
    orderBy: [{ followUpDate: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getContactsToReach() {
  const today = new Date();
  const todos = await db.todo.findMany({
    where: {
      progress: { in: ["waiting", "in_progress"] },
      contactId: { not: null },
    },
    include: {
      contact: true,
    },
    orderBy: { followUpDate: "asc" },
  });

  const dueContacts = todos
    .filter((todo) => todo.contact && todo.followUpDate && todo.followUpDate <= today)
    .map((todo) => todo.contact!)
    .filter(Boolean);

  const unique = new Map<string, (typeof dueContacts)[number]>();
  for (const contact of dueContacts) {
    unique.set(contact.id, contact);
  }

  return Array.from(unique.values()).slice(0, 5);
}

export async function getRecentActiveTodos(limit = 10) {
  return db.todo.findMany({
    where: { progress: { not: "done" } },
    include: todoInclude,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getRecentlyCompletedTodos(limit = 10) {
  const todos = await db.todo.findMany({
    where: { progress: "done" },
    include: todoInclude,
    orderBy: [{ completedAt: "desc" }, { updatedAt: "desc" }],
    take: limit * 2,
  });

  return todos
    .filter((todo) => {
      const stamp = todo.completedAt ?? todo.updatedAt;
      return stamp && isWithinDays(stamp, 14);
    })
    .slice(0, limit);
}

export async function getDashboardData() {
  const [
    todayTodos,
    activeTodos,
    waitingTodos,
    globalTodos,
    contactsToReach,
    recentlyCompleted,
  ] = await Promise.all([
    getTodos({ view: "today" }),
    getRecentActiveTodos(8),
    getTodos({ view: "active" }).then((items) =>
      items.filter((item) => item.progress === "waiting"),
    ),
    getTodos({ view: "global" }),
    getContactsToReach(),
    getRecentlyCompletedTodos(5),
  ]);

  return {
    todayTodos,
    activeTodos,
    waitingTodos,
    globalTodos,
    contactsToReach,
    recentlyCompleted,
  };
}

export async function getCalendarTodos() {
  return db.todo.findMany({
    where: {
      followUpDate: { not: null },
      progress: { not: "done" },
    },
    include: {
      city: { select: { name: true } },
    },
    orderBy: { followUpDate: "asc" },
  });
}

export async function getFormOptions() {
  const [cities, contacts, tags] = await Promise.all([
    db.city.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.contact.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.tag.findMany({
      orderBy: [{ usageCount: "desc" }, { name: "asc" }],
      select: { name: true },
    }),
  ]);

  return { cities, contacts, tags: tags.map((tag) => tag.name) };
}

export async function getTagsWithStats() {
  const tags = await db.tag.findMany({
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          todoTags: true,
          noteTags: true,
        },
      },
    },
  });

  return tags.map((tag) => ({
    name: tag.name,
    usageCount: tag._count.todoTags + tag._count.noteTags,
  }));
}

export async function getNotes(filters?: {
  type?: string;
  tag?: string;
  readStatus?: string;
}) {
  const where: {
    type?: string;
    readStatus?: string;
    tags?: { some: { tag: { name: string } } };
  } = {};

  if (filters?.type) {
    where.type = filters.type;
  }

  if (filters?.readStatus) {
    where.readStatus = filters.readStatus;
  }

  if (filters?.tag) {
    where.tags = { some: { tag: { name: filters.tag } } };
  }

  return db.note.findMany({
    where,
    include: noteInclude,
    orderBy: { updatedAt: "desc" },
  });
}
