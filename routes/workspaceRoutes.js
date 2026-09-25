/**
 * Smart Expense Splitter - Workspace & Room Routes
 * MIT-WPU TY CSE CCD/AIES LCA-2
 */

const express = require('express');
const router = express.Router();

// In-memory workspace cache for multi-device sync
const workspaces = new Map();

// Helper to generate unique room ID
const generateRoomId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'ROOM-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// 1. POST /api/workspace/create
router.post('/create', (req, res) => {
  try {
    const { name, yourName, passcode, roomId } = req.body || {};
    const finalRoomId = (roomId || generateRoomId()).toUpperCase();
    const finalPasscode = passcode || '';
    const creatorName = yourName || 'Admin';

    const workspaceData = {
      id: finalRoomId,
      name: name || `Workspace ${finalRoomId}`,
      passcode: finalPasscode,
      activeUser: creatorName,
      members: [creatorName, 'Friend 1', 'Friend 2'],
      expenses: [],
      createdAt: new Date().toISOString()
    };

    workspaces.set(finalRoomId, workspaceData);

    const token = Buffer.from(`${finalRoomId}:${Date.now()}`).toString('base64');

    return res.status(201).json({
      success: true,
      data: {
        roomId: finalRoomId,
        passcode: finalPasscode,
        name: workspaceData.name,
        token: `Bearer ${token}`
      },
      message: `Workspace ${finalRoomId} created successfully`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/workspace/join
router.post('/join', (req, res) => {
  try {
    const { roomId, passcode, yourName } = req.body || {};
    const targetId = (roomId || '').trim().toUpperCase();

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'Room ID is required to join' });
    }

    let workspace = workspaces.get(targetId);

    if (!workspace) {
      // Seed on-demand for multi-device collaboration
      workspace = {
        id: targetId,
        name: `Room ${targetId}`,
        passcode: passcode || '',
        activeUser: yourName || 'Member',
        members: [yourName || 'Member'],
        expenses: [],
        createdAt: new Date().toISOString()
      };
      workspaces.set(targetId, workspace);
    } else {
      if (workspace.passcode && passcode && workspace.passcode !== passcode) {
        return res.status(401).json({ success: false, error: 'Incorrect passcode for this room' });
      }
      if (yourName && !workspace.members.includes(yourName)) {
        workspace.members.push(yourName);
      }
      workspace.activeUser = yourName || workspace.activeUser;
    }

    const token = Buffer.from(`${targetId}:${Date.now()}`).toString('base64');

    return res.status(200).json({
      success: true,
      data: {
        ...workspace,
        token: `Bearer ${token}`
      },
      message: `Joined workspace ${targetId}`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
