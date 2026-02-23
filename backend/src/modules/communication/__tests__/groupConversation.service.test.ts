/**
 * GroupConversation Service Tests
 * 
 * Unit tests for group conversation management
 * 
 * Requirements: 24.2, 24.8, 24.9
 */

import { groupConversationService } from '../groupConversation.service';
import { groupConversationRepository } from '../groupConversation.repository';
import { groupMemberRepository } from '../groupMember.repository';

// Mock repositories
jest.mock('../groupConversation.repository');
jest.mock('../groupMember.repository');

describe('GroupConversationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGroupConversation', () => {
    it('should create a class-based group conversation', async () => {
      const mockGroup = {
        groupConversationId: 1,
        name: 'Class 10-A Morning',
        type: 'class' as const,
        classId: 1,
        createdBy: 1,
        isAnnouncementOnly: false,
        isActive: true,
      };

      (groupConversationRepository.findByClassId as jest.Mock).mockResolvedValue(null);
      (groupConversationRepository.create as jest.Mock).mockResolvedValue(mockGroup);
      (groupMemberRepository.create as jest.Mock).mockResolvedValue({});

      const result = await groupConversationService.createGroupConversation({
        name: 'Class 10-A Morning',
        type: 'class',
        classId: 1,
        createdBy: 1,
      });

      expect(result).toEqual(mockGroup);
      expect(groupConversationRepository.create).toHaveBeenCalledWith({
        name: 'Class 10-A Morning',
        type: 'class',
        classId: 1,
        createdBy: 1,
        isAnnouncementOnly: false,
      });
      expect(groupMemberRepository.create).toHaveBeenCalledWith({
        groupConversationId: 1,
        userId: 1,
        role: 'admin',
      });
    });

    it('should throw error if class group already exists', async () => {
      (groupConversationRepository.findByClassId as jest.Mock).mockResolvedValue({
        groupConversationId: 1,
      });

      await expect(
        groupConversationService.createGroupConversation({
          name: 'Class 10-A Morning',
          type: 'class',
          classId: 1,
          createdBy: 1,
        })
      ).rejects.toThrow('Group conversation already exists for this class');
    });

    it('should throw error if class ID is missing for class-based group', async () => {
      await expect(
        groupConversationService.createGroupConversation({
          name: 'Class 10-A Morning',
          type: 'class',
          createdBy: 1,
        })
      ).rejects.toThrow('Class ID is required for class-based groups');
    });

    it('should create announcement channel', async () => {
      const mockGroup = {
        groupConversationId: 2,
        name: 'School Announcements',
        type: 'announcement' as const,
        createdBy: 1,
        isAnnouncementOnly: true,
        isActive: true,
      };

      (groupConversationRepository.create as jest.Mock).mockResolvedValue(mockGroup);
      (groupMemberRepository.create as jest.Mock).mockResolvedValue({});

      const result = await groupConversationService.createGroupConversation({
        name: 'School Announcements',
        type: 'announcement',
        createdBy: 1,
        isAnnouncementOnly: true,
      });

      expect(result).toEqual(mockGroup);
      expect(groupConversationRepository.create).toHaveBeenCalledWith({
        name: 'School Announcements',
        type: 'announcement',
        createdBy: 1,
        isAnnouncementOnly: true,
      });
    });

    it('should add members and admins when creating group', async () => {
      const mockGroup = {
        groupConversationId: 3,
        name: 'Custom Group',
        type: 'custom' as const,
        createdBy: 1,
        isAnnouncementOnly: false,
        isActive: true,
      };

      (groupConversationRepository.create as jest.Mock).mockResolvedValue(mockGroup);
      (groupMemberRepository.create as jest.Mock).mockResolvedValue({});
      (groupMemberRepository.bulkCreate as jest.Mock).mockResolvedValue([]);

      await groupConversationService.createGroupConversation({
        name: 'Custom Group',
        type: 'custom',
        createdBy: 1,
        memberIds: [2, 3, 4],
        adminIds: [5],
      });

      expect(groupMemberRepository.create).toHaveBeenCalledWith({
        groupConversationId: 3,
        userId: 1,
        role: 'admin',
      });

      expect(groupMemberRepository.bulkCreate).toHaveBeenCalledWith([
        { groupConversationId: 3, userId: 5, role: 'admin' },
      ]);

      expect(groupMemberRepository.bulkCreate).toHaveBeenCalledWith([
        { groupConversationId: 3, userId: 2, role: 'member' },
        { groupConversationId: 3, userId: 3, role: 'member' },
        { groupConversationId: 3, userId: 4, role: 'member' },
      ]);
    });
  });

  describe('addMember', () => {
    it('should add member to group if requester is admin', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(false);
      (groupMemberRepository.create as jest.Mock).mockResolvedValue({
        groupMemberId: 1,
        groupConversationId: 1,
        userId: 2,
        role: 'member',
      });

      const result = await groupConversationService.addMember(1, 2, 1);

      expect(result).toBeDefined();
      expect(groupMemberRepository.create).toHaveBeenCalledWith({
        groupConversationId: 1,
        userId: 2,
        role: 'member',
      });
    });

    it('should throw error if requester is not admin', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(false);

      await expect(
        groupConversationService.addMember(1, 2, 3)
      ).rejects.toThrow('Access denied: Only admins can add members');
    });

    it('should throw error if user is already a member', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(true);

      await expect(
        groupConversationService.addMember(1, 2, 1)
      ).rejects.toThrow('User is already a member of this group');
    });
  });

  describe('removeMember', () => {
    it('should allow admin to remove member', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.getAdminCount as jest.Mock).mockResolvedValue(2);
      (groupMemberRepository.findByGroupAndUser as jest.Mock).mockResolvedValue({
        role: 'member',
      });
      (groupMemberRepository.remove as jest.Mock).mockResolvedValue(true);

      const result = await groupConversationService.removeMember(1, 2, 1);

      expect(result).toEqual({ success: true });
      expect(groupMemberRepository.remove).toHaveBeenCalledWith(1, 2);
    });

    it('should allow user to remove themselves', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(false);
      (groupMemberRepository.remove as jest.Mock).mockResolvedValue(true);

      const result = await groupConversationService.removeMember(1, 2, 2);

      expect(result).toEqual({ success: true });
    });

    it('should throw error if non-admin tries to remove other member', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(false);

      await expect(
        groupConversationService.removeMember(1, 2, 3)
      ).rejects.toThrow('Access denied: Only admins can remove members');
    });

    it('should throw error when removing last admin', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.getAdminCount as jest.Mock).mockResolvedValue(1);
      (groupMemberRepository.findByGroupAndUser as jest.Mock).mockResolvedValue({
        role: 'admin',
      });

      await expect(
        groupConversationService.removeMember(1, 2, 1)
      ).rejects.toThrow('Cannot remove the last admin from the group');
    });
  });

  describe('promoteMemberToAdmin', () => {
    it('should promote member to admin', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.findByGroupAndUser as jest.Mock).mockResolvedValue({
        role: 'member',
      });
      (groupMemberRepository.updateRole as jest.Mock).mockResolvedValue(true);

      const result = await groupConversationService.promoteMemberToAdmin(1, 2, 1);

      expect(result).toEqual({ success: true });
      expect(groupMemberRepository.updateRole).toHaveBeenCalledWith(1, 2, 'admin');
    });

    it('should throw error if requester is not admin', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(false);

      await expect(
        groupConversationService.promoteMemberToAdmin(1, 2, 3)
      ).rejects.toThrow('Access denied: Only admins can promote members');
    });

    it('should throw error if user is already admin', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.findByGroupAndUser as jest.Mock).mockResolvedValue({
        role: 'admin',
      });

      await expect(
        groupConversationService.promoteMemberToAdmin(1, 2, 1)
      ).rejects.toThrow('User is already an admin');
    });
  });

  describe('demoteAdminToMember', () => {
    it('should demote admin to member', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.getAdminCount as jest.Mock).mockResolvedValue(2);
      (groupMemberRepository.updateRole as jest.Mock).mockResolvedValue(true);

      const result = await groupConversationService.demoteAdminToMember(1, 2, 1);

      expect(result).toEqual({ success: true });
      expect(groupMemberRepository.updateRole).toHaveBeenCalledWith(1, 2, 'member');
    });

    it('should throw error when demoting last admin', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupMemberRepository.getAdminCount as jest.Mock).mockResolvedValue(1);

      await expect(
        groupConversationService.demoteAdminToMember(1, 2, 1)
      ).rejects.toThrow('Cannot demote the last admin');
    });
  });

  describe('updateGroupConversation', () => {
    it('should update group settings if user is admin', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(true);
      (groupConversationRepository.update as jest.Mock).mockResolvedValue(true);

      const result = await groupConversationService.updateGroupConversation(
        1,
        1,
        { name: 'Updated Name', isAnnouncementOnly: true }
      );

      expect(result).toEqual({ success: true });
      expect(groupConversationRepository.update).toHaveBeenCalledWith(1, {
        name: 'Updated Name',
        isAnnouncementOnly: true,
      });
    });

    it('should throw error if user is not admin', async () => {
      (groupConversationRepository.isAdmin as jest.Mock).mockResolvedValue(false);

      await expect(
        groupConversationService.updateGroupConversation(1, 2, { name: 'Updated Name' })
      ).rejects.toThrow('Access denied: Only admins can update group settings');
    });
  });

  describe('getGroupConversationById', () => {
    it('should return group if user is member', async () => {
      const mockGroup = {
        groupConversationId: 1,
        name: 'Test Group',
        type: 'custom' as const,
        createdBy: 1,
        isAnnouncementOnly: false,
        isActive: true,
      };

      (groupConversationRepository.findById as jest.Mock).mockResolvedValue(mockGroup);
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(true);

      const result = await groupConversationService.getGroupConversationById(1, 2);

      expect(result).toEqual(mockGroup);
    });

    it('should throw error if group not found', async () => {
      (groupConversationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        groupConversationService.getGroupConversationById(1, 2)
      ).rejects.toThrow('Group conversation not found');
    });

    it('should throw error if user is not member', async () => {
      const mockGroup = {
        groupConversationId: 1,
        name: 'Test Group',
      };

      (groupConversationRepository.findById as jest.Mock).mockResolvedValue(mockGroup);
      (groupConversationRepository.isMember as jest.Mock).mockResolvedValue(false);

      await expect(
        groupConversationService.getGroupConversationById(1, 2)
      ).rejects.toThrow('Access denied: User is not a member of this group');
    });
  });
});
