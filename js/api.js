// ============================================================
//  LibraX – api.js
//  Centralized API client for all PHP backend calls
// ============================================================
"use strict";

const STORAGE_KEY = "librax_local_storage_v1";
const SESSION_KEY = "librax_session_v1";

function padCode(num) {
  return String(num).padStart(3, "0");
}

function nextBookCode(items) {
  const nums = items.map(
    (item) => Number(String(item.id).replace(/\D/g, "")) || 0,
  );
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `B${padCode(next)}`;
}

function nextMemberCode(items) {
  const nums = items.map(
    (item) => Number(String(item.id).replace(/\D/g, "")) || 0,
  );
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `M${padCode(next)}`;
}

function nextTransCode(items) {
  const nums = items.map(
    (item) => Number(String(item.id).replace(/\D/g, "")) || 0,
  );
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `T${padCode(next)}`;
}

function nextReserveCode(items) {
  const nums = items.map(
    (item) =>
      Number(String(item.reserve_code || item.id).replace(/\D/g, "")) || 0,
  );
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `R${padCode(next)}`;
}

function makeDefaultState() {
  const today = new Date();
  const iso = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  const books = [
    {
      id: "B001",
      dbId: 1,
      title: "Introduction to Algorithms",
      author: "Thomas H. Cormen",
      category: "Computer Science",
      isbn: "978-0262033848",
      publisher: "MIT Press",
      year: 2009,
      copies: 3,
      available: 2,
      shelf: "CS-01",
      createdAt: iso(40),
    },
    {
      id: "B002",
      dbId: 2,
      title: "Clean Code",
      author: "Robert C. Martin",
      category: "Technology",
      isbn: "978-0132350884",
      publisher: "Prentice Hall",
      year: 2008,
      copies: 2,
      available: 2,
      shelf: "T-03",
      createdAt: iso(45),
    },
    {
      id: "B003",
      dbId: 3,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      category: "Fiction",
      isbn: "978-0743273565",
      publisher: "Scribner",
      year: 1925,
      copies: 4,
      available: 4,
      shelf: "L-02",
      createdAt: iso(31),
    },
    {
      id: "B004",
      dbId: 4,
      title: "A Brief History of Time",
      author: "Stephen Hawking",
      category: "Science",
      isbn: "978-0553380163",
      publisher: "Bantam Books",
      year: 1988,
      copies: 2,
      available: 1,
      shelf: "S-01",
      createdAt: iso(22),
    },
    {
      id: "B005",
      dbId: 5,
      title: "Discrete Mathematics",
      author: "Kenneth H. Rosen",
      category: "Mathematics",
      isbn: "978-0073383095",
      publisher: "McGraw-Hill",
      year: 2012,
      copies: 3,
      available: 3,
      shelf: "M-01",
      createdAt: iso(58),
    },
    {
      id: "B006",
      dbId: 6,
      title: "The Art of War",
      author: "Sun Tzu",
      category: "History",
      isbn: "978-1599869773",
      publisher: "El Paso Norte Press",
      year: 2009,
      copies: 2,
      available: 2,
      shelf: "H-01",
      createdAt: iso(36),
    },
    {
      id: "B007",
      dbId: 7,
      title: "Operating System Concepts",
      author: "Abraham Silberschatz",
      category: "Computer Science",
      isbn: "978-1118063330",
      publisher: "Wiley",
      year: 2018,
      copies: 4,
      available: 3,
      shelf: "CS-02",
      createdAt: iso(19),
    },
    {
      id: "B008",
      dbId: 8,
      title: "Database System Concepts",
      author: "Henry F. Korth",
      category: "Computer Science",
      isbn: "978-0078022159",
      publisher: "McGraw-Hill",
      year: 2019,
      copies: 3,
      available: 2,
      shelf: "CS-03",
      createdAt: iso(15),
    },
    {
      id: "B009",
      dbId: 9,
      title: "Linear Algebra Done Right",
      author: "Sheldon Axler",
      category: "Mathematics",
      isbn: "978-3319110806",
      publisher: "Springer",
      year: 2015,
      copies: 2,
      available: 2,
      shelf: "M-02",
      createdAt: iso(11),
    },
    {
      id: "B010",
      dbId: 10,
      title: "Wings of Fire",
      author: "A.P.J. Abdul Kalam",
      category: "Literature",
      isbn: "978-8173711466",
      publisher: "Universities Press",
      year: 1999,
      copies: 5,
      available: 4,
      shelf: "LT-01",
      createdAt: iso(28),
    },
    {
      id: "B011",
      dbId: 11,
      title: "Computer Networks",
      author: "Andrew S. Tanenbaum",
      category: "Computer Science",
      isbn: "978-0132126953",
      publisher: "Pearson",
      year: 2010,
      copies: 3,
      available: 3,
      shelf: "CS-04",
      createdAt: iso(60),
    },
    {
      id: "B012",
      dbId: 12,
      title: "The Alchemist",
      author: "Paulo Coelho",
      category: "Fiction",
      isbn: "978-0062315007",
      publisher: "HarperCollins",
      year: 2014,
      copies: 3,
      available: 3,
      shelf: "L-03",
      createdAt: iso(24),
    },
  ];

  const members = [
    {
      id: "M001",
      dbId: 1,
      name: "Arjun Sharma",
      type: "Student",
      email: "arjun.sharma@mca.edu",
      phone: "9876543210",
      dept: "MCA",
      year: 2024,
      booksIssued: 1,
      status: "Active",
    },
    {
      id: "M002",
      dbId: 2,
      name: "Priya Patil",
      type: "Student",
      email: "priya.patil@mca.edu",
      phone: "9812345678",
      dept: "MCA",
      year: 2024,
      booksIssued: 2,
      status: "Active",
    },
    {
      id: "M003",
      dbId: 3,
      name: "Dr. Rajesh Desai",
      type: "Faculty",
      email: "r.desai@college.edu",
      phone: "9765432100",
      dept: "CS Dept.",
      year: 2018,
      booksIssued: 0,
      status: "Active",
    },
    {
      id: "M004",
      dbId: 4,
      name: "Sneha Kulkarni",
      type: "Student",
      email: "sneha.k@mca.edu",
      phone: "9899887766",
      dept: "MCA",
      year: 2025,
      booksIssued: 1,
      status: "Active",
    },
    {
      id: "M005",
      dbId: 5,
      name: "Rohan Mehta",
      type: "Student",
      email: "rohan.m@mca.edu",
      phone: "9123456789",
      dept: "MCA",
      year: 2024,
      booksIssued: 0,
      status: "Active",
    },
    {
      id: "M006",
      dbId: 6,
      name: "Prof. Anita Joshi",
      type: "Faculty",
      email: "anita.j@college.edu",
      phone: "9000001111",
      dept: "Mathematics",
      year: 2015,
      booksIssued: 0,
      status: "Active",
    },
    {
      id: "M007",
      dbId: 7,
      name: "Vikas Sutar",
      type: "Staff",
      email: "vikas.s@college.edu",
      phone: "9988776655",
      dept: "Admin",
      year: 2020,
      booksIssued: 0,
      status: "Active",
    },
  ];

  const transactions = [
    {
      id: "T001",
      dbId: 1,
      bookId: "B001",
      bookTitle: "Introduction to Algorithms",
      bookAuthor: "Thomas H. Cormen",
      memberId: "M001",
      memberName: "Arjun Sharma",
      memberType: "Student",
      issueDate: iso(10),
      dueDate: iso(-4),
      returnDate: null,
      fine: 0,
      finePaid: false,
      status: "Overdue",
    },
    {
      id: "T002",
      dbId: 2,
      bookId: "B004",
      bookTitle: "A Brief History of Time",
      bookAuthor: "Stephen Hawking",
      memberId: "M001",
      memberName: "Arjun Sharma",
      memberType: "Student",
      issueDate: iso(20),
      dueDate: iso(6),
      returnDate: null,
      fine: 12,
      finePaid: false,
      status: "Overdue",
    },
    {
      id: "T003",
      dbId: 3,
      bookId: "B002",
      bookTitle: "Clean Code",
      bookAuthor: "Robert C. Martin",
      memberId: "M002",
      memberName: "Priya Patil",
      memberType: "Student",
      issueDate: iso(5),
      dueDate: iso(9),
      returnDate: null,
      fine: 0,
      finePaid: false,
      status: "Active",
    },
    {
      id: "T004",
      dbId: 4,
      bookId: "B007",
      bookTitle: "Operating System Concepts",
      bookAuthor: "Abraham Silberschatz",
      memberId: "M002",
      memberName: "Priya Patil",
      memberType: "Student",
      issueDate: iso(30),
      dueDate: iso(16),
      returnDate: iso(18),
      fine: 0,
      finePaid: false,
      status: "Returned",
    },
    {
      id: "T005",
      dbId: 5,
      bookId: "B008",
      bookTitle: "Database System Concepts",
      bookAuthor: "Henry F. Korth",
      memberId: "M004",
      memberName: "Sneha Kulkarni",
      memberType: "Student",
      issueDate: iso(3),
      dueDate: iso(11),
      returnDate: null,
      fine: 0,
      finePaid: false,
      status: "Active",
    },
    {
      id: "T006",
      dbId: 6,
      bookId: "B010",
      bookTitle: "Wings of Fire",
      bookAuthor: "A.P.J. Abdul Kalam",
      memberId: "M002",
      memberName: "Priya Patil",
      memberType: "Student",
      issueDate: iso(8),
      dueDate: iso(-6),
      returnDate: null,
      fine: 0,
      finePaid: false,
      status: "Active",
    },
  ];

  const reservations = [
    {
      reserve_code: "R001",
      book_id: 3,
      book_title: "The Great Gatsby",
      member_id: 5,
      member_name: "Rohan Mehta",
      reserve_date: iso(3),
      status: "Pending",
      available_copies: 0,
    },
    {
      reserve_code: "R002",
      book_id: 10,
      book_title: "Wings of Fire",
      member_id: 7,
      member_name: "Vikas Sutar",
      reserve_date: iso(1),
      status: "Pending",
      available_copies: 0,
    },
  ];

  return {
    users: [
      {
        id: 1,
        username: "admin",
        password: "admin123",
        name: "Administrator",
        role: "admin",
      },
    ],
    books,
    members,
    transactions,
    reservations,
  };
}

function getState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.warn("Corrupted localStorage state, recreating defaults");
    }
  }
  const state = makeDefaultState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function buildBookRow(row) {
  return {
    id: row.id,
    dbId: row.dbId || Number(row.id?.replace(/\D/g, "") || 0),
    title: row.title,
    author: row.author,
    category: row.category,
    isbn: row.isbn || "",
    publisher: row.publisher || "",
    year: row.year,
    copies: Number(row.copies),
    available: Number(row.available),
    shelf: row.shelf || "",
    createdAt: row.createdAt || new Date().toISOString(),
  };
}

function mapTransactions(txns) {
  return txns.map((txn) => ({
    id: txn.id,
    dbId: txn.dbId,
    bookId: txn.bookId,
    bookTitle: txn.bookTitle,
    bookAuthor: txn.bookAuthor || "",
    memberId: txn.memberId,
    memberName: txn.memberName,
    memberType: txn.memberType,
    issueDate: txn.issueDate,
    dueDate: txn.dueDate,
    returnDate: txn.returnDate,
    fine: Number(txn.fine || 0),
    finePaid: Boolean(txn.finePaid),
    status: txn.status,
  }));
}

const API = {
  auth: {
    check: async () => {
      const user = getSession();
      if (user) return { success: true, user };
      return { success: false, error: "Not logged in" };
    },
    login: async (username, password) => {
      const state = getState();
      const user = state.users.find(
        (item) => item.username === username && item.password === password,
      );
      if (!user)
        return { success: false, error: "Invalid username or password" };
      const safeUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
      setSession(safeUser);
      return { success: true, user: safeUser };
    },
    logout: async () => {
      clearSession();
      return { success: true, message: "Logged out successfully" };
    },
  },

  dashboard: {
    get: async () => {
      const state = getState();
      const books = state.books;
      const members = state.members;
      const txns = state.transactions;
      const totalBooks = books.length;
      const totalMembers = members.length;
      const totalIssued = txns.filter(
        (t) => t.status === "Active" || t.status === "Overdue",
      ).length;
      const totalAvailable = books.reduce(
        (sum, book) => sum + Number(book.available || 0),
        0,
      );
      const totalOverdue = txns.filter((t) => t.status === "Overdue").length;
      const totalFineUnpaid = txns
        .filter((t) => t.status === "Overdue" || t.fine > 0)
        .reduce(
          (sum, t) => sum + Number(t.fine || 0) * (t.finePaid ? 0 : 1),
          0,
        );
      const totalFineCollected = txns
        .filter((t) => t.finePaid)
        .reduce((sum, t) => sum + Number(t.fine || 0), 0);

      const categories = Object.entries(
        books.reduce((acc, book) => {
          acc[book.category] =
            (acc[book.category] || 0) + Number(book.copies || 0);
          return acc;
        }, {}),
      ).map(([category, total]) => ({ category, total }));

      const recent = [...txns]
        .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
        .slice(0, 6)
        .map((t) => ({
          book_title: t.bookTitle,
          member_name: t.memberName,
          status: t.status,
          issue_date: t.issueDate,
        }));

      const overdueList = txns
        .filter((t) => t.status === "Overdue")
        .map((t) => {
          const due = new Date(t.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const daysOverdue = Math.max(0, Math.floor((today - due) / 86400000));
          const member = members.find((m) => m.id === t.memberId);
          return {
            book_title: t.bookTitle,
            member_name: t.memberName,
            phone: member ? member.phone : "",
            days_overdue: daysOverdue,
            fine_amount: Number(t.fine || 0),
          };
        });

      const trend = Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - index));
        const label = date.toLocaleString("en-US", { month: "short" });
        const count = txns.filter((t) => {
          const d = new Date(t.issueDate);
          return (
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        }).length;
        return { month_label: label, issue_count: count };
      });

      return {
        success: true,
        stats: {
          totalBooks,
          totalMembers,
          totalIssued,
          totalAvailable,
          totalOverdue,
          totalFineUnpaid,
          totalFineCollected,
        },
        categories,
        recent,
        overdueList,
        trend,
      };
    },
  },

  books: {
    list: async (params = {}) => {
      const state = getState();
      let data = state.books.map(buildBookRow);
      const search = String(params.search || "")
        .trim()
        .toLowerCase();
      const category = String(params.category || "").trim();
      const status = String(params.status || "").trim();

      if (search) {
        data = data.filter((book) =>
          [book.title, book.author, book.id, book.isbn]
            .join(" ")
            .toLowerCase()
            .includes(search),
        );
      }
      if (category) {
        data = data.filter((book) => book.category === category);
      }
      if (status === "Available") {
        data = data.filter((book) => book.available > 0);
      } else if (status === "Issued") {
        data = data.filter((book) => book.available === 0);
      }

      const id = params.id;
      if (id) {
        data = data.filter((book) => book.id === id);
      }

      return { success: true, data, total: data.length };
    },
    create: async (payload) => {
      const state = getState();
      const nextId = nextBookCode(state.books);
      const book = {
        id: nextId,
        dbId: state.books.length + 1,
        title: payload.title,
        author: payload.author,
        category: payload.category,
        isbn: payload.isbn || "",
        publisher: payload.publisher || "",
        year: payload.year || null,
        copies: Number(payload.copies || 1),
        available: Number(payload.copies || 1),
        shelf: payload.shelf || "",
        createdAt: new Date().toISOString(),
      };
      state.books.push(book);
      saveState(state);
      return {
        success: true,
        data: buildBookRow(book),
        message: `"${book.title}" added to library`,
      };
    },
    update: async (id, payload) => {
      const state = getState();
      const target = state.books.find((book) => book.id === id);
      if (!target) return { success: false, error: "Book not found" };

      const issuedCount = Number(target.copies) - Number(target.available);
      const newCopies = Number(payload.copies ?? target.copies);
      const newAvailable = Math.max(0, newCopies - issuedCount);

      Object.assign(target, {
        title: payload.title ?? target.title,
        author: payload.author ?? target.author,
        category: payload.category ?? target.category,
        isbn: payload.isbn ?? target.isbn,
        publisher: payload.publisher ?? target.publisher,
        year: payload.year ?? target.year,
        copies: newCopies,
        available: newAvailable,
        shelf: payload.shelf ?? target.shelf,
      });

      saveState(state);
      return {
        success: true,
        data: buildBookRow(target),
        message: "Book updated successfully",
      };
    },
    delete: async (id) => {
      const state = getState();
      const hasActive = state.transactions.some(
        (txn) =>
          txn.bookId === id &&
          (txn.status === "Active" || txn.status === "Overdue"),
      );
      if (hasActive)
        return {
          success: false,
          error: "Cannot delete – book is currently issued to a member",
        };

      state.books = state.books.filter((book) => book.id !== id);
      saveState(state);
      return { success: true, message: "Book deleted successfully" };
    },
  },

  members: {
    list: async (params = {}) => {
      const state = getState();
      let members = [...state.members];
      const search = String(params.search || "")
        .trim()
        .toLowerCase();
      const type = String(params.type || "").trim();
      const id = params.id;

      if (search) {
        members = members.filter((member) =>
          [member.name, member.email, member.id, member.phone]
            .join(" ")
            .toLowerCase()
            .includes(search),
        );
      }
      if (type) {
        members = members.filter((member) => member.type === type);
      }
      if (id) {
        members = members.filter((member) => member.id === id);
      }

      return { success: true, data: members, total: members.length };
    },
    create: async (payload) => {
      const state = getState();
      const nextId = nextMemberCode(state.members);
      const member = {
        id: nextId,
        dbId: state.members.length + 1,
        name: payload.name,
        type: payload.type,
        email: payload.email,
        phone: payload.phone,
        dept: payload.dept || "",
        year: payload.year || null,
        booksIssued: 0,
        status: "Active",
      };
      state.members.push(member);
      saveState(state);
      return {
        success: true,
        data: member,
        message: `"${member.name}" added successfully`,
      };
    },
    update: async (id, payload) => {
      const state = getState();
      const target = state.members.find((member) => member.id === id);
      if (!target) return { success: false, error: "Member not found" };
      Object.assign(target, {
        name: payload.name ?? target.name,
        type: payload.type ?? target.type,
        email: payload.email ?? target.email,
        phone: payload.phone ?? target.phone,
        dept: payload.dept ?? target.dept,
        year: payload.year ?? target.year,
      });
      saveState(state);
      return {
        success: true,
        data: target,
        message: "Member updated successfully",
      };
    },
    delete: async (id) => {
      const state = getState();
      const hasActive = state.transactions.some(
        (txn) =>
          txn.memberId === id &&
          (txn.status === "Active" || txn.status === "Overdue"),
      );
      if (hasActive)
        return {
          success: false,
          error: "Cannot delete – member has active transactions",
        };
      state.members = state.members.filter((member) => member.id !== id);
      saveState(state);
      return { success: true, message: "Member deleted successfully" };
    },
    history: async (id) => {
      const state = getState();
      const rows = state.transactions
        .filter((txn) => txn.memberId === id)
        .map((txn) => ({
          trans_code: txn.id,
          book_title: txn.bookTitle,
          issue_date: txn.issueDate,
          due_date: txn.dueDate,
          return_date: txn.returnDate,
          fine_amount: Number(txn.fine || 0),
          status: txn.status,
        }));
      return { success: true, data: rows };
    },
  },

  transactions: {
    list: async (filter = "all") => {
      const state = getState();
      let txns = mapTransactions(state.transactions);
      if (filter && filter !== "all") {
        const key = filter.toLowerCase();
        if (key === "active") txns = txns.filter((t) => t.status === "Active");
        else if (key === "returned")
          txns = txns.filter((t) => t.status === "Returned");
        else if (key === "overdue")
          txns = txns.filter((t) => t.status === "Overdue");
      }
      return { success: true, data: txns, total: txns.length };
    },
    issue: async (payload) => {
      const state = getState();
      const book = state.books.find((item) => item.id === payload.bookId);
      const member = state.members.find((item) => item.id === payload.memberId);

      if (!book) return { success: false, error: "Book not found" };
      if (!member)
        return { success: false, error: "Member not found or inactive" };
      if (Number(book.available) < 1)
        return { success: false, error: "No copies available for this book" };
      if (
        state.transactions.some(
          (txn) =>
            txn.bookId === payload.bookId &&
            txn.memberId === payload.memberId &&
            (txn.status === "Active" || txn.status === "Overdue"),
        )
      ) {
        return {
          success: false,
          error: "This member already has this book issued",
        };
      }
      if (
        !payload.dueDate ||
        new Date(payload.dueDate) <= new Date(new Date().toDateString())
      ) {
        return { success: false, error: "Due date must be in the future" };
      }

      const nextId = nextTransCode(state.transactions);
      const txn = {
        id: nextId,
        dbId: state.transactions.length + 1,
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        memberId: member.id,
        memberName: member.name,
        memberType: member.type,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: payload.dueDate,
        returnDate: null,
        fine: 0,
        finePaid: false,
        status: "Active",
      };

      state.transactions.push(txn);
      book.available = Number(book.available) - 1;
      member.booksIssued = Number(member.booksIssued || 0) + 1;
      saveState(state);
      return {
        success: true,
        data: txn,
        message: `"${book.title}" issued to ${member.name}`,
      };
    },
    return: async (id) => {
      const state = getState();
      const txn = state.transactions.find((item) => item.id === id);
      if (!txn) return { success: false, error: "Transaction not found" };
      if (txn.status === "Returned")
        return { success: false, error: "Book already returned" };

      const due = new Date(txn.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const overdueDays =
        today > due ? Math.max(0, Math.floor((today - due) / 86400000)) : 0;
      const fine = overdueDays * 2;

      txn.returnDate = today.toISOString().split("T")[0];
      txn.status = "Returned";
      txn.fine = fine;
      txn.finePaid = false;

      const book = state.books.find((item) => item.id === txn.bookId);
      const member = state.members.find((item) => item.id === txn.memberId);
      if (book) book.available = Number(book.available) + 1;
      if (member)
        member.booksIssued = Math.max(0, Number(member.booksIssued || 0) - 1);

      saveState(state);
      return {
        success: true,
        fine,
        overdueDays,
        message:
          fine > 0
            ? `Book returned. Fine: ₹${fine} (${overdueDays} days overdue). Please collect from member.`
            : "Book returned successfully! No fine applicable.",
      };
    },
    payFine: async (id) => {
      const state = getState();
      const txn = state.transactions.find((item) => item.id === id);
      if (!txn) return { success: false, error: "Transaction not found" };
      if (txn.finePaid)
        return { success: false, error: "Fine already marked as paid" };
      txn.finePaid = true;
      saveState(state);
      return { success: true, message: `Fine of ₹${txn.fine} marked as paid` };
    },
    reserve: async (payload) => {
      const state = getState();
      const book = state.books.find((item) => item.id === payload.bookId);
      const member = state.members.find((item) => item.id === payload.memberId);
      if (!book) return { success: false, error: "Book not found" };
      if (!member) return { success: false, error: "Member not found" };
      if (Number(book.available) > 0)
        return {
          success: false,
          error: "Book is available – please issue directly",
        };
      const exists = state.reservations.some(
        (item) =>
          item.book_id === book.dbId &&
          item.member_id === member.dbId &&
          item.status === "Pending",
      );
      if (exists)
        return {
          success: false,
          error: "Member already has a pending reservation for this book",
        };

      const code = nextReserveCode(state.reservations);
      const reservation = {
        reserve_code: code,
        book_id: book.dbId,
        book_title: book.title,
        member_id: member.dbId,
        member_name: member.name,
        reserve_date: new Date().toISOString().split("T")[0],
        status: "Pending",
        available_copies: Number(book.available || 0),
      };
      state.reservations.push(reservation);
      saveState(state);
      return {
        success: true,
        message: `"${book.title}" reserved for ${member.name} (Code: ${code})`,
      };
    },
    reservations: async () => {
      const state = getState();
      return { success: true, data: state.reservations };
    },
  },
};

window.API = API;
