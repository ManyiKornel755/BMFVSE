const express = require('express');
const Group = require('../models/Group');
const { authenticate, isAdminOrCoach } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/groups - Get all groups with member count
router.get('/', isAdminOrCoach, async (req, res, next) => {
  try {
    const groups = await Group.getAllWithMemberCount();
    res.json(groups);
  } catch (error) {
    next(error);
  }
});

// GET /api/groups/:id - Get group by ID
router.get('/:id', isAdminOrCoach, async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        error: 'Group not found',
        status: 404
      });
    }

    res.json(group);
  } catch (error) {
    next(error);
  }
});

// POST /api/groups - Create new group
router.post('/', isAdminOrCoach, async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'Group name is required',
        status: 400
      });
    }

    const group = await Group.create({
      name: name.trim(),
      created_by: req.user.id
    });

    res.status(201).json(group);
  } catch (error) {
    next(error);
  }
});

// PUT /api/groups/:id - Update group name
router.put('/:id', isAdminOrCoach, async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'Group name is required',
        status: 400
      });
    }

    const updatedGroup = await Group.update(req.params.id, {
      name: name.trim()
    });

    res.json(updatedGroup);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/groups/:id - Soft delete group
router.delete('/:id', isAdminOrCoach, async (req, res, next) => {
  try {
    await Group.delete(req.params.id);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/groups/:id/members - Get all members of a group
router.get('/:id/members', isAdminOrCoach, async (req, res, next) => {
  try {
    const members = await Group.getMembers(req.params.id);
    res.json(members);
  } catch (error) {
    next(error);
  }
});

// POST /api/groups/:id/members - Add member(s) to group
router.post('/:id/members', isAdminOrCoach, async (req, res, next) => {
  try {
    const { userIds } = req.body;

    if (!userIds) {
      return res.status(400).json({
        error: 'userIds is required',
        status: 400
      });
    }

    // Support both single user and multiple users
    if (Array.isArray(userIds)) {
      if (userIds.length === 0) {
        return res.status(400).json({
          error: 'userIds array cannot be empty',
          status: 400
        });
      }

      if (userIds.length > 50) {
        return res.status(400).json({
          error: 'Cannot add more than 50 members at once',
          status: 400
        });
      }

      const result = await Group.addMembers(req.params.id, userIds);
      res.status(201).json({
        message: `${result.addedCount} member(s) added successfully`,
        ...result
      });
    } else {
      const result = await Group.addMember(req.params.id, userIds);
      res.status(201).json({
        message: 'Member added successfully',
        ...result
      });
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/groups/:id/members/:userId - Remove member from group
router.delete('/:id/members/:userId', isAdminOrCoach, async (req, res, next) => {
  try {
    await Group.removeMember(req.params.id, req.params.userId);
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
