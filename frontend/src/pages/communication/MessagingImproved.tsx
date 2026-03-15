/**
 * Messaging Page - Improved Version
 * 
 * Displays conversation list, one-on-one chat, and group chat with enhanced design
 * 
 * Requirements: 24.1, 24.2, 24.3
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Badge,
  Tab,
  Tabs,
  InputAdornment,
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Divider,
  Autocomplete,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Circle as CircleIcon,
  ArrowBack as ArrowBackIcon,
  EmojiEmotions as EmojiIcon,
} from '@mui/icons-material';
