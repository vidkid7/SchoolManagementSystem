import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  School,
} from '@mui/icons-material';
import type { NavItem } from './navigation';
import { navigationSections } from './navigation';

interface SidebarProps {
  collapsed: boolean;
  currentPath: string;
  role?: string;
  onCollapse: () => void;
  onNavigate: (path: string) => void;
}

const navy = '#081427';

function canSee(item: NavItem, role?: string) {
  if (!item.roles?.length) return true;
  return Boolean(role && item.roles.includes(role));
}

function itemIsActive(item: NavItem, currentPath: string): boolean {
  if (item.path && (currentPath === item.path || currentPath.startsWith(`${item.path}/`))) return true;
  return Boolean(item.children?.some((child) => itemIsActive(child, currentPath)));
}

export function Sidebar({ collapsed, currentPath, role, onCollapse, onNavigate }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const sections = useMemo(
    () =>
      navigationSections
        .map((section) => ({
          ...section,
          items: section.items
            .filter((item) => canSee(item, role))
            .map((item) => ({
              ...item,
              children: item.children?.filter((child) => canSee(child, role)),
            }))
            .filter((item) => !item.children || item.children.length > 0 || item.path),
        }))
        .filter((section) => section.items.length > 0),
    [role]
  );

  const renderItem = (item: NavItem, depth = 0) => {
    const active = itemIsActive(item, currentPath);
    const hasChildren = Boolean(item.children?.length);
    const open = openGroups[item.label] ?? active;

    const button = (
      <ListItemButton
        selected={active}
        onClick={() => {
          if (hasChildren) {
            setOpenGroups((current) => ({ ...current, [item.label]: !open }));
          } else if (item.path) {
            onNavigate(item.path);
          }
        }}
        sx={{
          minHeight: 42,
          mx: 1,
          mb: 0.35,
          pl: collapsed ? 1.4 : 1.7 + depth * 2,
          pr: collapsed ? 1.4 : 1,
          borderRadius: 2,
          color: active ? '#fff' : 'rgba(226,232,240,0.78)',
          bgcolor: active ? 'rgba(37,99,235,0.98)' : 'transparent',
          boxShadow: active ? '0 10px 28px rgba(37,99,235,0.28)' : 'none',
          '&:hover': {
            bgcolor: active ? 'rgba(37,99,235,1)' : 'rgba(148,163,184,0.12)',
            color: '#fff',
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 38, color: 'inherit', justifyContent: 'center' }}>
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 800 : 650 }}
            />
            {item.badge && (
              <Chip label={item.badge} size="small" sx={{ height: 20, bgcolor: 'rgba(255,255,255,0.12)', color: '#e2e8f0', fontSize: 10 }} />
            )}
            {hasChildren ? open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" /> : null}
          </>
        )}
      </ListItemButton>
    );

    return (
      <Box key={`${item.label}-${item.path || 'group'}`}>
        {collapsed ? <Tooltip title={item.label} placement="right">{button}</Tooltip> : button}
        {hasChildren && !collapsed && (
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ py: 0.25 }}>
              {item.children!.map((child) => renderItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', bgcolor: navy, color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" alignItems="center" justifyContent={collapsed ? 'center' : 'space-between'} sx={{ px: 1.75, py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.2} sx={{ minWidth: 0 }}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#2563eb', boxShadow: '0 12px 28px rgba(37,99,235,0.35)' }}>
            <School />
          </Box>
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, lineHeight: 1.1, letterSpacing: 0 }}>SchoolOS</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700 }}>Management Suite</Typography>
            </Box>
          )}
        </Stack>
        {!collapsed && (
          <IconButton onClick={onCollapse} size="small" sx={{ color: '#cbd5e1', bgcolor: 'rgba(255,255,255,0.07)' }}>
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}
      </Stack>

      {collapsed && (
        <IconButton onClick={onCollapse} size="small" sx={{ mx: 'auto', mb: 1, color: '#cbd5e1', bgcolor: 'rgba(255,255,255,0.07)' }}>
          <ChevronRight fontSize="small" />
        </IconButton>
      )}

      <Divider sx={{ borderColor: 'rgba(148,163,184,0.18)' }} />

      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1.4 }}>
        {sections.map((section) => (
          <Box key={section.id} sx={{ mb: 1.5 }}>
            {!collapsed && (
              <Typography variant="caption" sx={{ display: 'block', px: 2.2, py: 0.8, color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {section.title}
              </Typography>
            )}
            <List disablePadding>{section.items.map((item) => renderItem(item))}</List>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
