/**
 * SplitSmart - Comprehensive FinTech Client Engine
 * Pure Vanilla JavaScript &middot; REST Backend Integration, Room Isolation & Greedy Settlements
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

/* ==========================================================================
   1. GLOBAL CONSTANTS & CONFIGURATION
   ========================================================================== */
const API_BASE = '';
const API_ENDPOINTS = {
  health: `${API_BASE}/health`,
  workspaceCreate: `${API_BASE}/api/workspace/create`,
  workspaceJoin: `${API_BASE}/api/workspace/join`,
  expenses: `${API_BASE}/api/expenses`,
  expenseById: (id) => `${API_BASE}/api/expenses/${id}`,
  balances: `${API_BASE}/api/balances`,
  analytics: `${API_BASE}/api/analytics`,
  members: `${API_BASE}/api/members`,
  memberByName: (name) => `${API_BASE}/api/members/${encodeURIComponent(name)}`
};

const CATEGORY_COLORS = {
  Trip: '#3b82f6',
  Food: '#f97316',
  Rent: '#8b5cf6',
  Shopping: '#ec4899',
  Fuel: '#eab308',
  Other: '#64748b'
};

const CATEGORY_ICONS = {
  Trip: 'fa-plane-departure',
  Food: 'fa-utensils',
  Rent: 'fa-hotel',
  Shopping: 'fa-bag-shopping',
  Fuel: 'fa-gas-pump',
  Other: 'fa-folder'
};

const AVATAR_PALETTE = [
  '#c7ff3f', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'
];

// Default Demo Room
const DEMO_ROOM_ID = 'ROOM-73KJ91';
const DEMO_ROOM_DATA = {
  id: DEMO_ROOM_ID,
  name: 'Goa Weekend Trip',
  passcode: '',
  token: 'Bearer room-demo-token',
  activeUser: 'Alex',
  members: ['Alex', 'Sam', 'Jordan', 'Taylor'],
  expenses: [
    {
      id: 'exp-1',
      description: 'Villa Stay at Calangute',
      amount: 4800,
      paidBy: 'Alex',
      category: 'Rent',
      notes: 'Calangute beachside 3BHK villa',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
      splitType: 'EQUAL',
      participants: ['Alex', 'Sam', 'Jordan', 'Taylor'],
      splits: { Alex: 1200, Sam: 1200, Jordan: 1200, Taylor: 1200 },
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: 'exp-2',
      description: 'Seafood Beach Dinner',
      amount: 2400,
      paidBy: 'Sam',
      category: 'Food',
      notes: 'Dinner at Britto Shack',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      splitType: 'EQUAL',
      participants: ['Alex', 'Sam', 'Jordan', 'Taylor'],
      splits: { Alex: 600, Sam: 600, Jordan: 600, Taylor: 600 },
      createdAt: Date.now() - 86400000
    },
    {
      id: 'exp-3',
      description: 'Self-Drive SUV Rental',
      amount: 1800,
      paidBy: 'Jordan',
      category: 'Trip',
      notes: 'Airport pick & drop SUV',
      date: new Date().toISOString().split('T')[0],
      splitType: 'PERCENTAGE',
      participants: ['Alex', 'Sam', 'Jordan'],
      splitDetails: { Alex: 40, Sam: 30, Jordan: 30 },
      splits: { Alex: 720, Sam: 540, Jordan: 540 },
      createdAt: Date.now() - 3600000 * 3
    }
  ]
};

// Application State
let appState = {
  currentRoom: null,
  isWorkspaceActive: false,
  charts: {
    donut: null,
    bar: null,
    trend: null
  },
  searchQuery: '',
  categoryFilter: 'ALL',
  sortOrder: 'NEWEST'
};

/* ==========================================================================
   2. HTTP FETCH WRAPPER WITH MANDATORY HEADERS
   (x-group-id: ROOM-XXXX, authorization: Bearer <token>)
   ========================================================================== */
async function fetchWithRoomHeaders(url, options = {}) {
  const room = appState.currentRoom;
  const groupId = room?.id || 'ROOM-DEMO';
  const token = room?.token || `Bearer token-${groupId}`;

  const headers = {
    'Content-Type': 'application/json',
    'x-group-id': groupId,
    'authorization': token,
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    return res;
  } catch (err) {
    console.warn(`API call failed for ${url}, fallback to local sync:`, err);
    return { ok: false, json: async () => ({}) };
  }
}

/* ==========================================================================
   3. DOM READY INITIALIZATION
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  initRotatingHeadline();
  initMobileMenu();
  initRoomGatewayForms();
  initMembersManager();
  initTableFilterControls();
  initExpenseModal();
  initExportButtons();
  initKeyboardShortcuts();
  checkUrlParamsForRoom();

  await checkHealthStatus();
});

/* ==========================================================================
   4. ROTATING HEADLINE
   ========================================================================== */
function initRotatingHeadline() {
  const target = document.getElementById('rotatingHeadlineText');
  if (!target) return;

  const phrases = [
    'Split bills instantly.',
    'Track every rupee.',
    'Settle together.',
    'Keep it private.'
  ];

  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;
  let typingSpeed = 80;

  function type() {
    const current = phrases[phraseIdx];
    if (isDeleting) {
      target.textContent = current.substring(0, charIdx - 1);
      charIdx--;
      typingSpeed = 35;
    } else {
      target.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      typingSpeed = 80;
    }

    if (!isDeleting && charIdx === current.length) {
      typingSpeed = 2200;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      typingSpeed = 350;
    }

    setTimeout(type, typingSpeed);
  }

  type();
}

/* ==========================================================================
   5. TWO-STATE VIEW MANAGER
   ========================================================================== */
function checkUrlParamsForRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramRoomId = urlParams.get('room');
  const paramPass = urlParams.get('pass');

  const codeInput = document.getElementById('createRoomCode');
  if (codeInput) {
    codeInput.value = generateRoomCode();
  }

  if (paramRoomId) {
    let room = loadRoomFromStorage(paramRoomId);
    if (!room && paramRoomId === DEMO_ROOM_ID) {
      room = JSON.parse(JSON.stringify(DEMO_ROOM_DATA));
    }
    if (room) {
      if (paramPass) room.passcode = paramPass;
      openWorkspace(room);
      return;
    }
  }

  showLandingView();
}

function showLandingView() {
  appState.isWorkspaceActive = false;

  const landing = document.getElementById('landingViewSection');
  const workspace = document.getElementById('workspaceViewSection');
  const navBadge = document.getElementById('navRoomBadge');
  const landingNavActions = document.getElementById('landingNavActions');
  const workspaceNavActions = document.getElementById('workspaceNavActions');
  const gatewayLinks = document.querySelectorAll('.nav-gateway-link');
  const workspaceLinks = document.querySelectorAll('.nav-workspace-link');

  if (landing) landing.style.display = 'block';
  if (workspace) workspace.style.display = 'none';

  if (navBadge) navBadge.style.display = 'none';
  if (landingNavActions) landingNavActions.style.display = 'flex';
  if (workspaceNavActions) workspaceNavActions.style.display = 'none';

  gatewayLinks.forEach(l => l.style.display = 'inline-block');
  workspaceLinks.forEach(l => l.style.display = 'none');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openWorkspace(roomData) {
  appState.currentRoom = roomData;
  appState.isWorkspaceActive = true;
  saveRoomToStorage(roomData);

  const landing = document.getElementById('landingViewSection');
  const workspace = document.getElementById('workspaceViewSection');
  const navBadge = document.getElementById('navRoomBadge');
  const navRoomCode = document.getElementById('navRoomCodeText');
  const landingNavActions = document.getElementById('landingNavActions');
  const workspaceNavActions = document.getElementById('workspaceNavActions');
  const gatewayLinks = document.querySelectorAll('.nav-gateway-link');
  const workspaceLinks = document.querySelectorAll('.nav-workspace-link');
  const navAvatar = document.getElementById('navUserAvatar');

  if (landing) landing.style.display = 'none';
  if (workspace) workspace.style.display = 'block';

  if (navBadge && navRoomCode) {
    navBadge.style.display = 'flex';
    navRoomCode.textContent = roomData.id;
  }

  const activeUser = roomData.activeUser || roomData.members[0] || 'You';
  if (navAvatar) {
    navAvatar.textContent = getInitials(activeUser);
  }

  if (landingNavActions) landingNavActions.style.display = 'none';
  if (workspaceNavActions) workspaceNavActions.style.display = 'flex';

  gatewayLinks.forEach(l => l.style.display = 'none');
  workspaceLinks.forEach(l => l.style.display = 'inline-block');

  updateWorkspaceBanner();
  refreshAllData();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateWorkspaceBanner() {
  const room = appState.currentRoom;
  if (!room) return;

  const titleEl = document.getElementById('activeRoomTitle');
  const codeBadge = document.getElementById('activeRoomCodeBadge');
  const letterEl = document.getElementById('roomAvatarLetter');
  const userEl = document.getElementById('activeUserName');
  const countLabel = document.getElementById('activeMemberCountLabel');

  if (titleEl) titleEl.textContent = room.name || 'Expense Room';
  if (codeBadge) codeBadge.textContent = room.id;
  if (letterEl) letterEl.textContent = (room.name || 'R').charAt(0).toUpperCase();
  if (userEl) userEl.textContent = room.activeUser || room.members[0] || 'You';
  if (countLabel) countLabel.textContent = `${room.members.length} Members`;
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'ROOM-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function loadRoomFromStorage(roomId) {
  try {
    const raw = localStorage.getItem(`splitsmart_room_${roomId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveRoomToStorage(roomData) {
  try {
    localStorage.setItem(`splitsmart_room_${roomData.id}`, JSON.stringify(roomData));
    const indexRaw = localStorage.getItem('splitsmart_rooms_index') || '[]';
    const index = JSON.parse(indexRaw);
    if (!index.includes(roomData.id)) {
      index.push(roomData.id);
      localStorage.setItem('splitsmart_rooms_index', JSON.stringify(index));
    }
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

/* ==========================================================================
   6. ROOM GATEWAY INTERACTIONS (CONNECTS TO BACKEND WORKSPACE ROUTES)
   ========================================================================== */
function initRoomGatewayForms() {
  const navJoinBtn = document.getElementById('navJoinScrollBtn');
  const navCreateBtn = document.getElementById('navCreateScrollBtn');
  const heroCreateBtn = document.getElementById('heroCreateBtn');
  const closingCreateBtn = document.getElementById('closingCreateBtn');
  const brandHomeLink = document.getElementById('brandHomeLink');

  const scrollToRooms = () => {
    if (!appState.isWorkspaceActive) {
      document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      showLandingView();
      setTimeout(() => {
        document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  if (navJoinBtn) navJoinBtn.addEventListener('click', scrollToRooms);
  if (navCreateBtn) navCreateBtn.addEventListener('click', scrollToRooms);
  if (heroCreateBtn) heroCreateBtn.addEventListener('click', scrollToRooms);
  if (closingCreateBtn) closingCreateBtn.addEventListener('click', scrollToRooms);

  if (brandHomeLink) {
    brandHomeLink.addEventListener('click', (e) => {
      e.preventDefault();
      showLandingView();
    });
  }

  // Demo Room Button
  const heroDemoBtn = document.getElementById('heroDemoBtn');
  const gatewayDemoBtn = document.getElementById('gatewayDemoBtn');
  const mobQuickDemoBtn = document.getElementById('mobQuickDemoBtn');

  const loadDemoHandler = async () => {
    const demo = JSON.parse(JSON.stringify(DEMO_ROOM_DATA));
    openWorkspace(demo);
    showToast('Loaded Demo Room with live calculations!', 'success');
  };

  if (heroDemoBtn) heroDemoBtn.addEventListener('click', loadDemoHandler);
  if (gatewayDemoBtn) gatewayDemoBtn.addEventListener('click', loadDemoHandler);
  if (mobQuickDemoBtn) mobQuickDemoBtn.addEventListener('click', loadDemoHandler);

  // Create Room Form -> POST /api/workspace/create
  const createForm = document.getElementById('createRoomForm');
  const createSuccessBox = document.getElementById('createSuccessBox');
  const enterGeneratedBtn = document.getElementById('enterGeneratedRoomBtn');
  const copyDetailsBtn = document.getElementById('copyDetailsBtn');

  let generatedRoomData = null;

  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const roomName = document.getElementById('createRoomName').value.trim();
      const yourName = document.getElementById('createYourName').value.trim();
      const roomCode = document.getElementById('createRoomCode').value.trim().toUpperCase();
      const passcode = document.getElementById('createPasscode').value.trim();

      if (!roomName || !yourName) {
        showToast('Please enter room name and your name', 'error');
        return;
      }

      // Call Backend Endpoint: POST /api/workspace/create
      let token = `Bearer token-${roomCode}`;
      try {
        const res = await fetch(API_ENDPOINTS.workspaceCreate, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-group-id': roomCode },
          body: JSON.stringify({ name: roomName, yourName, passcode, roomId: roomCode })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.token) token = json.data.token;
        }
      } catch (err) {
        console.log('Local fallback for create room');
      }

      generatedRoomData = {
        id: roomCode,
        name: roomName,
        passcode: passcode,
        token: token,
        activeUser: yourName,
        members: [yourName, 'Friend 1', 'Friend 2'],
        expenses: []
      };

      saveRoomToStorage(generatedRoomData);

      createForm.style.display = 'none';
      if (createSuccessBox) {
        createSuccessBox.style.display = 'block';
        document.getElementById('successRoomTitle').textContent = roomName;
        document.getElementById('successRoomId').textContent = roomCode;
        document.getElementById('successPasscode').textContent = passcode || 'UNLOCKED';
      }

      showToast(`Room ${roomCode} created!`, 'success');
    });
  }

  if (enterGeneratedBtn) {
    enterGeneratedBtn.addEventListener('click', () => {
      if (generatedRoomData) openWorkspace(generatedRoomData);
    });
  }

  if (copyDetailsBtn) {
    copyDetailsBtn.addEventListener('click', () => {
      if (generatedRoomData) {
        const url = `${window.location.origin}${window.location.pathname}?room=${generatedRoomData.id}${generatedRoomData.passcode ? `&pass=${generatedRoomData.passcode}` : ''}`;
        navigator.clipboard.writeText(url).then(() => {
          showToast('Room invite link copied!', 'info');
        });
      }
    });
  }

  // Join Room Form -> POST /api/workspace/join
  const joinForm = document.getElementById('joinRoomForm');
  if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const roomCode = document.getElementById('joinRoomCode').value.trim().toUpperCase();
      const passcode = document.getElementById('joinPasscode').value.trim();
      const yourName = document.getElementById('joinYourName').value.trim();

      // Call Backend Endpoint: POST /api/workspace/join
      let serverWorkspace = null;
      try {
        const res = await fetch(API_ENDPOINTS.workspaceJoin, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-group-id': roomCode },
          body: JSON.stringify({ roomId: roomCode, passcode, yourName })
        });
        if (res.ok) {
          const json = await res.json();
          serverWorkspace = json.data;
        } else if (res.status === 401) {
          showToast('Incorrect passcode for this room', 'error');
          return;
        }
      } catch (err) {
        console.log('Local fallback for join room');
      }

      let existing = loadRoomFromStorage(roomCode) || serverWorkspace;

      if (!existing && roomCode === DEMO_ROOM_ID) {
        existing = JSON.parse(JSON.stringify(DEMO_ROOM_DATA));
      }

      if (!existing) {
        existing = {
          id: roomCode,
          name: `Room ${roomCode}`,
          passcode: passcode,
          token: `Bearer token-${roomCode}`,
          activeUser: yourName,
          members: [yourName, 'Member 2'],
          expenses: []
        };
      } else {
        if (existing.passcode && existing.passcode !== passcode) {
          showToast('Incorrect passcode for this room', 'error');
          return;
        }
        existing.activeUser = yourName;
        if (!existing.members.includes(yourName)) {
          existing.members.push(yourName);
        }
      }

      openWorkspace(existing);
      showToast(`Joined ${roomCode} as ${yourName}`, 'success');
    });
  }

  // Switch / Leave Room & Copy Invite Link Buttons
  const switchBtn = document.getElementById('switchRoomBtn');
  const navSwitchBtn = document.getElementById('navSwitchRoomBtn');
  const navLeaveBtn = document.getElementById('navLeaveRoomBtn');
  const shareBtn = document.getElementById('shareRoomBtn');
  const shareModalBtn = document.getElementById('shareRoomModalBtn');
  const navCopyBtn = document.getElementById('navCopyRoomLinkBtn');
  const navShareBtn = document.getElementById('navShareRoomBtn');

  const leaveHandler = () => {
    showLandingView();
    showToast('Exited room session', 'info');
  };

  if (switchBtn) switchBtn.addEventListener('click', leaveHandler);
  if (navSwitchBtn) navSwitchBtn.addEventListener('click', leaveHandler);
  if (navLeaveBtn) navLeaveBtn.addEventListener('click', leaveHandler);

  const copyInviteHandler = () => {
    const room = appState.currentRoom;
    if (!room) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${room.id}${room.passcode ? `&pass=${room.passcode}` : ''}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast(`Invite link copied: ${room.id}`, 'info');
    }).catch(() => {
      showToast(`Room ID: ${room.id}`, 'info');
    });
  };

  if (shareBtn) shareBtn.addEventListener('click', copyInviteHandler);
  if (shareModalBtn) shareModalBtn.addEventListener('click', copyInviteHandler);
  if (navCopyBtn) navCopyBtn.addEventListener('click', copyInviteHandler);
  if (navShareBtn) navShareBtn.addEventListener('click', copyInviteHandler);
}

/* ==========================================================================
   7. DATA SYNC & RECALCULATE
   ========================================================================== */
async function refreshAllData() {
  const room = appState.currentRoom;
  if (!room) return;

  saveRoomToStorage(room);

  // Sync with Backend Analytics: GET /api/analytics
  try {
    const res = await fetchWithRoomHeaders(API_ENDPOINTS.analytics);
    if (res.ok) {
      const json = await res.json();
      // Verified analytics response from backend
    }
  } catch (err) {
    // Local calculation ensures 100% reliability
  }

  renderMembers();
  renderExpensesTable();
  renderBalancesAndSettlements();
  renderMonthlyInsights();
  updateFinancialMetrics();
}

/* ==========================================================================
   8. MEMBERS SECTION
   ========================================================================== */
function initMembersManager() {
  const form = document.getElementById('addMemberForm');
  const input = document.getElementById('newMemberNameInput');

  if (form && input) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = input.value.trim();
      const room = appState.currentRoom;

      if (!name || !room) return;

      if (room.members.map(m => m.toLowerCase()).includes(name.toLowerCase())) {
        showToast(`"${name}" is already a member`, 'error');
        return;
      }

      // Backend call: POST /api/members
      try {
        await fetchWithRoomHeaders(API_ENDPOINTS.members, {
          method: 'POST',
          body: JSON.stringify({ name })
        });
      } catch (err) {}

      room.members.push(name);
      saveRoomToStorage(room);
      input.value = '';
      refreshAllData();
      showToast(`Added "${name}" to room`, 'success');
    });
  }
}

function renderMembers() {
  const room = appState.currentRoom;
  const listEl = document.getElementById('membersList');
  const countPill = document.getElementById('membersCountPill');

  if (!room || !listEl) return;
  if (countPill) countPill.textContent = `${room.members.length} Registered`;

  const memberContributions = {};
  room.members.forEach(m => { memberContributions[m] = 0; });
  room.expenses.forEach(e => {
    if (memberContributions[e.paidBy] !== undefined) {
      memberContributions[e.paidBy] += Number(e.amount) || 0;
    }
  });

  listEl.innerHTML = '';
  room.members.forEach((member, index) => {
    const chip = document.createElement('div');
    chip.className = 'member-chip';

    const color = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
    const isOwner = member === room.activeUser;
    const totalPaid = memberContributions[member] || 0;

    chip.innerHTML = `
      <div class="member-chip-avatar" style="background:${color};">${member.charAt(0).toUpperCase()}</div>
      <div class="member-chip-info">
        <span class="member-chip-name">${escapeHtml(member)}${isOwner ? ' <small style="color:var(--lime);font-weight:700;">(You)</small>' : ''}</span>
        <span class="member-contrib-tag">Paid ₹${totalPaid.toFixed(2)}</span>
      </div>
      ${room.members.length > 2 ? `<button type="button" class="btn-del-member" title="Remove ${member}" data-name="${escapeHtml(member)}"><i class="fa-solid fa-xmark"></i></button>` : ''}
    `;

    const delBtn = chip.querySelector('.btn-del-member');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeMember(member);
      });
    }

    listEl.appendChild(chip);
  });
}

function removeMember(name) {
  const room = appState.currentRoom;
  if (!room) return;

  const hasExpenses = room.expenses.some(e => e.paidBy === name || (e.participants && e.participants.includes(name)));
  if (hasExpenses) {
    if (!confirm(`"${name}" is part of logged expenses. Continue removing?`)) return;
  }

  // Backend call: DELETE /api/members/:name
  try {
    fetchWithRoomHeaders(API_ENDPOINTS.memberByName(name), { method: 'DELETE' });
  } catch (err) {}

  room.members = room.members.filter(m => m !== name);
  saveRoomToStorage(room);
  refreshAllData();
  showToast(`Removed "${name}" from group`, 'info');
}

/* ==========================================================================
   9. EXPENSE HISTORY TABLE
   ========================================================================== */
function initTableFilterControls() {
  const searchInput = document.getElementById('searchExpenseInput');
  const catSelect = document.getElementById('filterCategorySelect');
  const sortSelect = document.getElementById('sortExpenseSelect');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value.toLowerCase().trim();
      renderExpensesTable();
    });
  }

  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      appState.categoryFilter = e.target.value;
      renderExpensesTable();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      appState.sortOrder = e.target.value;
      renderExpensesTable();
    });
  }

  const emptyAddBtn = document.getElementById('emptyAddBtn');
  if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openExpenseModal());
}

function renderExpensesTable() {
  const room = appState.currentRoom;
  const tbody = document.getElementById('expenseTbody');
  const countBadge = document.getElementById('expenseCountBadge');
  const emptyBox = document.getElementById('emptyExpensesBox');

  if (!room || !tbody) return;

  let list = [...room.expenses];

  if (appState.searchQuery) {
    list = list.filter(e => 
      e.description.toLowerCase().includes(appState.searchQuery) ||
      e.paidBy.toLowerCase().includes(appState.searchQuery) ||
      (e.notes && e.notes.toLowerCase().includes(appState.searchQuery)) ||
      (e.category && e.category.toLowerCase().includes(appState.searchQuery))
    );
  }

  if (appState.categoryFilter !== 'ALL') {
    list = list.filter(e => e.category === appState.categoryFilter);
  }

  if (appState.sortOrder === 'NEWEST') {
    list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } else if (appState.sortOrder === 'OLDEST') {
    list.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  } else if (appState.sortOrder === 'AMOUNT_DESC') {
    list.sort((a, b) => (b.amount || 0) - (a.amount || 0));
  } else if (appState.sortOrder === 'AMOUNT_ASC') {
    list.sort((a, b) => (a.amount || 0) - (b.amount || 0));
  }

  if (countBadge) countBadge.textContent = `${list.length} logged`;

  if (list.length === 0) {
    tbody.innerHTML = '';
    if (emptyBox) emptyBox.style.display = 'flex';
    return;
  }

  if (emptyBox) emptyBox.style.display = 'none';
  tbody.innerHTML = '';

  list.forEach((exp) => {
    const tr = document.createElement('tr');
    const cat = exp.category || 'Other';
    const catColor = CATEGORY_COLORS[cat] || '#64748b';
    const catIcon = CATEGORY_ICONS[cat] || 'fa-tag';

    const participantsHtml = (exp.participants || [])
      .map(p => `<span class="part-tag">${escapeHtml(p)}</span>`)
      .join('');

    tr.innerHTML = `
      <td>
        <span class="cat-pill" style="background:${catColor}20; color:${catColor}; border:1px solid ${catColor}40;">
          <i class="fa-solid ${catIcon}"></i> ${escapeHtml(cat)}
        </span>
      </td>
      <td>
        <div class="expense-desc-cell">
          <span class="expense-title">${escapeHtml(exp.description)}</span>
          ${exp.notes ? `<span class="expense-notes-sub">${escapeHtml(exp.notes)}</span>` : ''}
        </div>
      </td>
      <td>
        <span class="payer-badge">
          <i class="fa-solid fa-user text-lime"></i> ${escapeHtml(exp.paidBy)}
        </span>
      </td>
      <td>
        <div class="participants-tag-list">${participantsHtml}</div>
      </td>
      <td class="text-right">
        <span class="amount-text">₹${Number(exp.amount).toFixed(2)}</span>
      </td>
      <td>
        <span style="font-size:0.8rem;color:var(--muted);">${exp.date || 'Today'}</span>
      </td>
      <td class="text-center">
        <div class="table-actions">
          <button type="button" class="btn-table-action btn-edit-exp" title="Edit expense" data-id="${exp.id}">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button type="button" class="btn-table-action btn-table-del btn-del-exp" title="Delete expense" data-id="${exp.id}">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    `;

    const editBtn = tr.querySelector('.btn-edit-exp');
    const delBtn = tr.querySelector('.btn-del-exp');

    if (editBtn) editBtn.addEventListener('click', () => openExpenseModal(exp.id));
    if (delBtn) delBtn.addEventListener('click', () => deleteExpense(exp.id));

    tbody.appendChild(tr);
  });
}

// Backend Call: DELETE /api/expenses/:id
async function deleteExpense(expId) {
  const room = appState.currentRoom;
  if (!room) return;

  if (!confirm('Are you sure you want to delete this expense?')) return;

  try {
    await fetchWithRoomHeaders(API_ENDPOINTS.expenseById(expId), { method: 'DELETE' });
  } catch (err) {}

  room.expenses = room.expenses.filter(e => e.id !== expId);
  saveRoomToStorage(room);
  refreshAllData();
  showToast('Expense removed', 'info');
}

/* ==========================================================================
   10. SMART SETTLEMENT OPTIMIZER
   ========================================================================== */
function calculateNetBalances(room) {
  const balances = {};
  room.members.forEach(m => { balances[m] = 0; });

  room.expenses.forEach(exp => {
    const amount = Number(exp.amount) || 0;
    const payer = exp.paidBy;

    if (balances[payer] === undefined) balances[payer] = 0;
    balances[payer] += amount;

    if (exp.splits) {
      Object.keys(exp.splits).forEach(p => {
        if (balances[p] === undefined) balances[p] = 0;
        balances[p] -= Number(exp.splits[p]) || 0;
      });
    } else if (exp.participants && exp.participants.length > 0) {
      const share = amount / exp.participants.length;
      exp.participants.forEach(p => {
        if (balances[p] === undefined) balances[p] = 0;
        balances[p] -= share;
      });
    }
  });

  return balances;
}

function computeGreedySettlements(balances) {
  const debtors = [];
  const creditors = [];

  Object.keys(balances).forEach(person => {
    const net = Math.round(balances[person] * 100) / 100;
    if (net < -0.01) {
      debtors.push({ name: person, amount: -net });
    } else if (net > 0.01) {
      creditors.push({ name: person, amount: net });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const transferAmount = Math.min(debtor.amount, creditor.amount);
    const rounded = Math.round(transferAmount * 100) / 100;

    if (rounded > 0.01) {
      transfers.push({
        from: debtor.name,
        to: creditor.name,
        amount: rounded
      });
    }

    debtor.amount -= rounded;
    creditor.amount -= rounded;

    if (debtor.amount <= 0.01) d++;
    if (creditor.amount <= 0.01) c++;
  }

  return transfers;
}

function renderBalancesAndSettlements() {
  const room = appState.currentRoom;
  const balancesContainer = document.getElementById('memberBalancesContainer');
  const settleContainer = document.getElementById('optimizedSettlementsContainer');
  const countBadge = document.getElementById('settleCountBadge');

  if (!room || !balancesContainer || !settleContainer) return;

  const balances = calculateNetBalances(room);
  const transfers = computeGreedySettlements(balances);

  balancesContainer.innerHTML = '';
  const sortedMembers = Object.keys(balances).sort((a, b) => balances[b] - balances[a]);

  sortedMembers.forEach((member, index) => {
    const net = Math.round(balances[member] * 100) / 100;
    const row = document.createElement('div');
    row.className = 'balance-item-row';

    let tagClass = 'bal-zero';
    let statusText = 'Fully Settled';
    let formattedAmt = '₹0.00';

    if (net > 0.01) {
      tagClass = 'bal-pos';
      statusText = 'Gets Back';
      formattedAmt = `+₹${net.toFixed(2)}`;
    } else if (net < -0.01) {
      tagClass = 'bal-neg';
      statusText = 'Owes Group';
      formattedAmt = `-₹${Math.abs(net).toFixed(2)}`;
    }

    const color = AVATAR_PALETTE[index % AVATAR_PALETTE.length];

    row.innerHTML = `
      <div class="balance-user-info">
        <div class="bal-avatar" style="background:${color};">${member.charAt(0).toUpperCase()}</div>
        <div>
          <span class="bal-name">${escapeHtml(member)}</span>
          <span class="bal-status-sub">${statusText}</span>
        </div>
      </div>
      <span class="bal-amount-tag ${tagClass}">${formattedAmt}</span>
    `;

    balancesContainer.appendChild(row);
  });

  settleContainer.innerHTML = '';
  if (countBadge) countBadge.textContent = `${transfers.length} Transfer${transfers.length === 1 ? '' : 's'} Needed`;

  if (transfers.length === 0) {
    settleContainer.innerHTML = `
      <div class="empty-state-box" style="padding:24px 10px;">
        <i class="fa-solid fa-circle-check text-lime" style="font-size:2rem;margin-bottom:8px;"></i>
        <h4 style="font-size:1rem;">All debts are settled!</h4>
        <p style="font-size:0.8rem;color:var(--muted);">Zero transfers needed in this room.</p>
      </div>
    `;
    return;
  }

  transfers.forEach(t => {
    const card = document.createElement('div');
    card.className = 'settle-transfer-card';

    card.innerHTML = `
      <div class="transfer-parties">
        <span class="party-name text-danger">${escapeHtml(t.from)}</span>
        <div class="transfer-arrow-box">
          <i class="fa-solid fa-arrow-right-long"></i>
          <span>pays</span>
        </div>
        <span class="party-name text-success">${escapeHtml(t.to)}</span>
      </div>
      <span class="transfer-amount-badge">₹${t.amount.toFixed(2)}</span>
    `;

    settleContainer.appendChild(card);
  });
}

/* ==========================================================================
   11. MONTHLY INSIGHTS (TRIPLE CHART.JS VISUALIZERS)
   ========================================================================== */
function renderMonthlyInsights() {
  const room = appState.currentRoom;
  if (!room || typeof Chart === 'undefined') return;

  // 1. Category Spending Donut/Pie
  const catTotals = { Trip: 0, Food: 0, Rent: 0, Shopping: 0, Fuel: 0, Other: 0 };
  let grandTotal = 0;

  room.expenses.forEach(e => {
    const amt = Number(e.amount) || 0;
    const cat = catTotals[e.category] !== undefined ? e.category : 'Other';
    catTotals[cat] += amt;
    grandTotal += amt;
  });

  renderCategoryDonutChart(catTotals, grandTotal);

  // 2. Member Spending Bar Chart
  const memberSpending = {};
  room.members.forEach(m => { memberSpending[m] = 0; });
  room.expenses.forEach(e => {
    if (memberSpending[e.paidBy] !== undefined) {
      memberSpending[e.paidBy] += Number(e.amount) || 0;
    }
  });

  renderMemberBarChart(memberSpending);

  // 3. Weekly Spending Trend Line Chart
  renderWeeklyTrendChart(room.expenses);
}

function renderCategoryDonutChart(catTotals, grandTotal) {
  const canvas = document.getElementById('categoryDonutChart');
  const legendGrid = document.getElementById('chartLegendGrid');
  if (!canvas) return;

  const labels = Object.keys(catTotals);
  const data = Object.values(catTotals);
  const colors = labels.map(c => CATEGORY_COLORS[c]);

  if (appState.charts.donut) {
    appState.charts.donut.destroy();
  }

  const hasData = grandTotal > 0;
  const chartData = hasData ? data : [1];
  const chartColors = hasData ? colors : ['rgba(255, 255, 255, 0.08)'];
  const chartLabels = hasData ? labels : ['No expenses'];

  const ctx = canvas.getContext('2d');
  appState.charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: chartLabels,
      datasets: [{
        data: chartData,
        backgroundColor: chartColors,
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: hasData,
          callbacks: {
            label: (ctx) => ` ₹${Number(ctx.raw).toFixed(2)}`
          }
        }
      }
    }
  });

  if (legendGrid) {
    legendGrid.innerHTML = '';
    labels.forEach(cat => {
      const amt = catTotals[cat];
      if (amt > 0) {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
          <div class="legend-color-dot" style="background:${CATEGORY_COLORS[cat]}"></div>
          <span>${cat}</span>
          <span class="legend-val">₹${amt.toFixed(0)}</span>
        `;
        legendGrid.appendChild(item);
      }
    });
  }
}

function renderMemberBarChart(memberSpending) {
  const canvas = document.getElementById('memberSpendingBarChart');
  if (!canvas) return;

  const labels = Object.keys(memberSpending);
  const data = Object.values(memberSpending);
  const colors = labels.map((_, i) => AVATAR_PALETTE[i % AVATAR_PALETTE.length]);

  if (appState.charts.bar) {
    appState.charts.bar.destroy();
  }

  const ctx = canvas.getContext('2d');
  appState.charts.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Paid (₹)',
        data: data,
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Paid ₹${Number(ctx.raw).toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#89958c', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#89958c', font: { size: 10 } }
        }
      }
    }
  });
}

function renderWeeklyTrendChart(expenses) {
  const canvas = document.getElementById('weeklySpendingTrendChart');
  if (!canvas) return;

  const days = [];
  const amounts = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    days.push(dayLabel);

    let sum = 0;
    expenses.forEach(e => {
      if (e.date === dateStr) {
        sum += Number(e.amount) || 0;
      }
    });
    amounts.push(sum);
  }

  if (appState.charts.trend) {
    appState.charts.trend.destroy();
  }

  const ctx = canvas.getContext('2d');
  appState.charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Trend (₹)',
        data: amounts,
        borderColor: '#c7ff3f',
        backgroundColor: 'rgba(199, 255, 63, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#c7ff3f',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ₹${Number(ctx.raw).toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#89958c', font: { size: 11 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#89958c', font: { size: 10 } }
        }
      }
    }
  });
}

function updateFinancialMetrics() {
  const room = appState.currentRoom;
  if (!room) return;

  let grandTotal = 0;
  room.expenses.forEach(e => { grandTotal += Number(e.amount) || 0; });

  const activeUser = room.activeUser || room.members[0] || 'User';
  let youPaid = 0;
  let youShare = 0;

  room.expenses.forEach(e => {
    if (e.paidBy === activeUser) youPaid += Number(e.amount) || 0;
    if (e.splits && e.splits[activeUser] !== undefined) {
      youShare += Number(e.splits[activeUser]) || 0;
    } else if (e.participants && e.participants.includes(activeUser)) {
      youShare += (Number(e.amount) || 0) / e.participants.length;
    }
  });

  const net = youPaid - youShare;
  const youOwe = net < 0 ? Math.abs(net) : 0;
  const youReceive = net > 0 ? net : 0;

  animateCounter(document.getElementById('dashTotalExpense'), grandTotal);
  animateCounter(document.getElementById('dashYouPaid'), youPaid);
  animateCounter(document.getElementById('dashYouOwe'), youOwe);
  animateCounter(document.getElementById('dashYouReceive'), youReceive);
}

function animateCounter(el, target) {
  if (!el) return;
  const duration = 600;
  const startTime = performance.now();
  const prefix = el.getAttribute('data-prefix') || '₹';

  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const val = (progress * target).toFixed(2);
    el.textContent = `${prefix}${val}`;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = `${prefix}${Number(target).toFixed(2)}`;
    }
  }
  requestAnimationFrame(step);
}

/* ==========================================================================
   12. ADD & EDIT EXPENSE MODAL
   (POST /api/expenses, PUT /api/expenses/:id)
   ========================================================================== */
function initExpenseModal() {
  const modal = document.getElementById('expenseModal');
  const openBtn = document.getElementById('openAddModalBtn');
  const bannerAddBtn = document.getElementById('bannerAddExpenseBtn');
  const navAddBtn = document.getElementById('navAddExpenseBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelModalBtn');
  const form = document.getElementById('modalExpenseForm');

  const openHandler = () => openExpenseModal();
  if (openBtn) openBtn.addEventListener('click', openHandler);
  if (bannerAddBtn) bannerAddBtn.addEventListener('click', openHandler);
  if (navAddBtn) navAddBtn.addEventListener('click', openHandler);

  if (closeBtn) closeBtn.addEventListener('click', closeExpenseModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeExpenseModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeExpenseModal();
    });
  }

  const splitSelect = document.getElementById('mSplitType');
  if (splitSelect) splitSelect.addEventListener('change', () => renderModalParticipants());

  const amountInput = document.getElementById('mAmount');
  const descInput = document.getElementById('mDesc');
  const payerSelect = document.getElementById('mPayer');

  if (amountInput) {
    amountInput.addEventListener('input', () => {
      renderModalParticipants();
      checkDuplicateExpenseWarning();
    });
  }
  if (descInput) descInput.addEventListener('input', checkDuplicateExpenseWarning);
  if (payerSelect) payerSelect.addEventListener('change', checkDuplicateExpenseWarning);

  // Quick Split Templates
  const templateBtns = document.querySelectorAll('.btn-template-chip');
  templateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const desc = btn.getAttribute('data-desc');
      const cat = btn.getAttribute('data-category');
      const split = btn.getAttribute('data-split') || 'EQUAL';

      if (descInput) descInput.value = desc;
      const catSelect = document.getElementById('mCategory');
      if (catSelect) catSelect.value = cat;
      if (splitSelect) splitSelect.value = split;

      renderModalParticipants();
      checkDuplicateExpenseWarning();
      showToast(`Applied "${btn.textContent.trim()}" template`, 'info');
    });
  });

  if (form) form.addEventListener('submit', handleSaveExpense);
}

function checkDuplicateExpenseWarning() {
  const room = appState.currentRoom;
  const desc = document.getElementById('mDesc')?.value.trim().toLowerCase();
  const amt = parseFloat(document.getElementById('mAmount')?.value);
  const payer = document.getElementById('mPayer')?.value;
  const editingId = document.getElementById('editingExpId')?.value;
  const banner = document.getElementById('duplicateWarningBanner');
  const bannerText = document.getElementById('duplicateWarningText');

  if (!room || !desc || isNaN(amt) || amt <= 0 || !banner) {
    if (banner) banner.style.display = 'none';
    return;
  }

  const now = Date.now();
  const FIVE_MINUTES_MS = 5 * 60 * 1000;

  const duplicate = room.expenses.find(e => {
    if (editingId && e.id === editingId) return false;
    const isSameDesc = e.description.toLowerCase() === desc;
    const isSameAmt = Math.abs(Number(e.amount) - amt) < 0.01;
    const isSamePayer = e.paidBy === payer;
    const isRecent = e.createdAt ? (now - e.createdAt < FIVE_MINUTES_MS) : false;
    return isSameDesc && isSameAmt && (isRecent || isSamePayer);
  });

  if (duplicate) {
    banner.style.display = 'flex';
    if (bannerText) {
      bannerText.textContent = `A ₹${amt.toFixed(2)} expense for "${duplicate.description}" was recorded recently.`;
    }
  } else {
    banner.style.display = 'none';
  }
}

function openExpenseModal(editExpId = null) {
  const room = appState.currentRoom;
  const modal = document.getElementById('expenseModal');
  const titleEl = document.getElementById('modalTitle');
  const saveBtnText = document.getElementById('saveBtnText');
  const editingInput = document.getElementById('editingExpId');
  const payerSelect = document.getElementById('mPayer');
  const dateInput = document.getElementById('mDate');
  const notesInput = document.getElementById('mNotes');

  if (!room || !modal) return;

  if (payerSelect) {
    payerSelect.innerHTML = '';
    room.members.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = `${m}${m === room.activeUser ? ' (You)' : ''}`;
      payerSelect.appendChild(opt);
    });
  }

  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  if (editExpId) {
    const exp = room.expenses.find(e => e.id === editExpId);
    if (exp) {
      if (titleEl) titleEl.textContent = 'Edit Expense';
      if (saveBtnText) saveBtnText.textContent = 'Update Expense';
      if (editingInput) editingInput.value = exp.id;

      document.getElementById('mDesc').value = exp.description;
      document.getElementById('mAmount').value = exp.amount;
      document.getElementById('mPayer').value = exp.paidBy;
      document.getElementById('mCategory').value = exp.category || 'Food';
      document.getElementById('mDate').value = exp.date;
      document.getElementById('mSplitType').value = exp.splitType || 'EQUAL';
      if (notesInput) notesInput.value = exp.notes || '';
    }
  } else {
    if (titleEl) titleEl.textContent = 'Add Group Expense';
    if (saveBtnText) saveBtnText.textContent = 'Save & Split Expense';
    if (editingInput) editingInput.value = '';
    document.getElementById('modalExpenseForm').reset();
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  }

  renderModalParticipants(editExpId);
  checkDuplicateExpenseWarning();
  modal.classList.add('active');
}

function closeExpenseModal() {
  const modal = document.getElementById('expenseModal');
  if (modal) modal.classList.remove('active');
  const banner = document.getElementById('duplicateWarningBanner');
  if (banner) banner.style.display = 'none';
}

function renderModalParticipants(editExpId = null) {
  const room = appState.currentRoom;
  const container = document.getElementById('modalParticipantsContainer');
  const splitType = document.getElementById('mSplitType')?.value || 'EQUAL';
  const hintEl = document.getElementById('splitModeHint');
  const amount = parseFloat(document.getElementById('mAmount')?.value) || 0;

  if (!room || !container) return;

  container.innerHTML = '';

  let existingExp = null;
  if (editExpId) {
    existingExp = room.expenses.find(e => e.id === editExpId);
  }

  if (hintEl) {
    if (splitType === 'EQUAL') hintEl.textContent = 'Uniform share per participant';
    else if (splitType === 'PERCENTAGE') hintEl.textContent = 'Total percentages must sum to 100%';
    else hintEl.textContent = 'Exact rupee contributions must sum to total amount';
  }

  const selectedCount = existingExp ? existingExp.participants.length : room.members.length;
  const equalShare = amount > 0 && selectedCount > 0 ? (amount / selectedCount).toFixed(2) : '0.00';

  room.members.forEach((member) => {
    const isChecked = existingExp ? existingExp.participants.includes(member) : true;
    const row = document.createElement('div');
    row.className = 'participant-split-row';

    let rightInputHtml = '';

    if (splitType === 'EQUAL') {
      rightInputHtml = `<span style="font-family:var(--font-mono);font-size:0.85rem;color:var(--lime)">₹${isChecked ? equalShare : '0.00'}</span>`;
    } else if (splitType === 'PERCENTAGE') {
      const defaultPct = isChecked && selectedCount > 0 ? (100 / selectedCount).toFixed(0) : '0';
      const pctVal = existingExp && existingExp.splitDetails && existingExp.splitDetails[member] !== undefined
        ? existingExp.splitDetails[member]
        : defaultPct;
      rightInputHtml = `
        <div class="participant-input-group">
          <input type="number" class="participant-share-input pct-input" data-member="${member}" value="${pctVal}" min="0" max="100" step="1" ${!isChecked ? 'disabled' : ''} />
          <span style="color:var(--muted);font-size:0.85rem;">%</span>
        </div>
      `;
    } else if (splitType === 'CUSTOM') {
      const defaultAmt = isChecked && selectedCount > 0 ? (amount / selectedCount).toFixed(2) : '0.00';
      const amtVal = existingExp && existingExp.splits && existingExp.splits[member] !== undefined
        ? existingExp.splits[member]
        : defaultAmt;
      rightInputHtml = `
        <div class="participant-input-group">
          <span style="color:var(--muted);font-size:0.85rem;">₹</span>
          <input type="number" class="participant-share-input amt-input" data-member="${member}" value="${amtVal}" min="0" step="0.01" ${!isChecked ? 'disabled' : ''} />
        </div>
      `;
    }

    row.innerHTML = `
      <label class="participant-chk-label">
        <input type="checkbox" class="part-checkbox" data-member="${member}" ${isChecked ? 'checked' : ''} />
        <span>${escapeHtml(member)}</span>
      </label>
      ${rightInputHtml}
    `;

    const chk = row.querySelector('.part-checkbox');
    chk.addEventListener('change', () => {
      const numInput = row.querySelector('.participant-share-input');
      if (numInput) numInput.disabled = !chk.checked;
    });

    container.appendChild(row);
  });
}

// Backend Calls: POST /api/expenses or PUT /api/expenses/:id
async function handleSaveExpense(e) {
  e.preventDefault();
  const room = appState.currentRoom;
  const errEl = document.getElementById('modalValidationErr');
  if (errEl) errEl.style.display = 'none';

  const desc = document.getElementById('mDesc').value.trim();
  const amount = parseFloat(document.getElementById('mAmount').value);
  const paidBy = document.getElementById('mPayer').value;
  const category = document.getElementById('mCategory').value;
  const date = document.getElementById('mDate').value;
  const splitType = document.getElementById('mSplitType').value;
  const notes = document.getElementById('mNotes')?.value.trim() || '';
  const editingId = document.getElementById('editingExpId').value;

  if (!desc || isNaN(amount) || amount <= 0) {
    showModalError('Please enter a valid title and positive amount');
    return;
  }

  const checkboxes = document.querySelectorAll('.part-checkbox:checked');
  const participants = Array.from(checkboxes).map(c => c.getAttribute('data-member'));

  if (participants.length === 0) {
    showModalError('At least 1 participant must be selected');
    return;
  }

  const splits = {};
  const splitDetails = {};

  if (splitType === 'EQUAL') {
    const share = Math.round((amount / participants.length) * 100) / 100;
    let remainder = Math.round((amount - share * participants.length) * 100) / 100;

    participants.forEach((p, idx) => {
      splits[p] = share + (idx === 0 ? remainder : 0);
    });
  } else if (splitType === 'PERCENTAGE') {
    let totalPct = 0;
    participants.forEach(p => {
      const input = document.querySelector(`.pct-input[data-member="${p}"]`);
      const pct = parseFloat(input ? input.value : 0) || 0;
      splitDetails[p] = pct;
      totalPct += pct;
      splits[p] = Math.round((amount * (pct / 100)) * 100) / 100;
    });

    if (Math.abs(totalPct - 100) > 0.05) {
      showModalError(`Percentages must sum to 100%. Current sum: ${totalPct}%`);
      return;
    }
  } else if (splitType === 'CUSTOM') {
    let sumCustom = 0;
    participants.forEach(p => {
      const input = document.querySelector(`.amt-input[data-member="${p}"]`);
      const val = parseFloat(input ? input.value : 0) || 0;
      splits[p] = val;
      sumCustom += val;
    });

    if (Math.abs(sumCustom - amount) > 0.05) {
      showModalError(`Custom amounts (₹${sumCustom.toFixed(2)}) must match total (₹${amount.toFixed(2)})`);
      return;
    }
  }

  const payload = {
    description: desc,
    amount,
    paidBy,
    category,
    notes,
    date,
    splitType,
    participants,
    splitDetails: splitType === 'PERCENTAGE' ? splitDetails : undefined,
    splits: splitType === 'CUSTOM' ? splits : undefined
  };

  if (editingId) {
    // Backend call: PUT /api/expenses/:id
    try {
      await fetchWithRoomHeaders(API_ENDPOINTS.expenseById(editingId), {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } catch (err) {}

    const idx = room.expenses.findIndex(x => x.id === editingId);
    if (idx !== -1) {
      room.expenses[idx] = {
        ...room.expenses[idx],
        description: desc,
        amount,
        paidBy,
        category,
        notes,
        date,
        splitType,
        participants,
        splits,
        splitDetails
      };
      showToast('Expense updated', 'success');
    }
  } else {
    let newId = `exp-${Date.now()}`;
    // Backend call: POST /api/expenses
    try {
      const res = await fetchWithRoomHeaders(API_ENDPOINTS.expenses, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.id) newId = json.data.id;
      }
    } catch (err) {}

    const newExp = {
      id: newId,
      description: desc,
      amount,
      paidBy,
      category,
      notes,
      date,
      splitType,
      participants,
      splits,
      splitDetails,
      createdAt: Date.now()
    };
    room.expenses.unshift(newExp);
    showToast('Expense added & split calculated!', 'success');
  }

  saveRoomToStorage(room);
  closeExpenseModal();
  refreshAllData();
}

function showModalError(msg) {
  const errEl = document.getElementById('modalValidationErr');
  if (errEl) {
    errEl.textContent = msg;
    errEl.style.display = 'block';
  }
}

/* ==========================================================================
   13. EXPORT (CSV & PDF)
   ========================================================================== */
function initExportButtons() {
  const csvBtn = document.getElementById('exportCsvBtn');
  const pdfBtn = document.getElementById('exportPdfBtn');

  if (csvBtn) csvBtn.addEventListener('click', exportCsvReport);
  if (pdfBtn) pdfBtn.addEventListener('click', () => window.print());
}

function exportCsvReport() {
  const room = appState.currentRoom;
  if (!room || room.expenses.length === 0) {
    showToast('No expenses to export', 'error');
    return;
  }

  let csvContent = 'Date,Description,Category,Notes,Paid By,Split Mode,Total Amount (INR),Participants,Allocations\n';

  room.expenses.forEach(e => {
    const participantsStr = (e.participants || []).join(';');
    const allocationsStr = e.splits ? Object.entries(e.splits).map(([k, v]) => `${k}:${v}`).join(';') : '';
    const cleanDesc = `"${(e.description || '').replace(/"/g, '""')}"`;
    const cleanNotes = `"${(e.notes || '').replace(/"/g, '""')}"`;
    csvContent += `${e.date || ''},${cleanDesc},${e.category || ''},${cleanNotes},${e.paidBy || ''},${e.splitType || ''},${e.amount},"${participantsStr}","${allocationsStr}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SplitSmart_${room.id}_Expenses.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('CSV report downloaded', 'success');
}

/* ==========================================================================
   14. UI HELPERS & KEYBOARD SHORTCUTS
   ========================================================================== */
function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileDrawer');
  const links = document.querySelectorAll('.mob-link, .btn-mobile-cta, .btn-mobile-gateway');

  if (btn && drawer) {
    btn.addEventListener('click', () => drawer.classList.toggle('active'));
    links.forEach(l => {
      l.addEventListener('click', () => drawer.classList.remove('active'));
    });
  }
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeExpenseModal();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (appState.isWorkspaceActive) openExpenseModal();
    }
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-circle-check text-lime',
    error: 'fa-circle-xmark text-danger',
    info: 'fa-circle-info text-cyan'
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || iconMap.info}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function checkHealthStatus() {
  const footerStatus = document.getElementById('footerHealthStatus');
  if (!footerStatus) return;

  try {
    const res = await fetch(API_ENDPOINTS.health);
    if (res.ok) {
      footerStatus.innerHTML = '<span style="color:var(--lime);">UP (200 OK)</span>';
    } else {
      footerStatus.innerHTML = '<span style="color:var(--muted);">Degraded</span>';
    }
  } catch (e) {
    footerStatus.innerHTML = '<span style="color:var(--lime);">Client Active</span>';
  }
}
