import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function Header() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, role, logout, isAdmin, isReception, isHousekeeping, isGuest } = useAuth();
  const [mode, setMode] = useState(() => localStorage.getItem('ui:mode') || 'light');

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('ui:mode', next);
    document.documentElement.dataset.theme = next;
  };

  const common = [];
  const adminLinks = [
    { label: 'Dashboard', path: '/admin-dashboard' },
    { label: 'Hotels', path: '/hotels' },
    { label: 'Rooms', path: '/rooms' },
    { label: 'Reservations', path: '/reservations' },
    { label: 'Users', path: '/users' },
    { label: 'Reports', path: '/reports' },
    { label: 'Analytics', path: '/analytics' },
  ];
  const receptionLinks = [
    { label: 'Dashboard', path: '/reception-dashboard' },
    { label: 'Check-ins', path: '/checkins' },
    { label: 'Check-outs', path: '/checkouts' },
    { label: 'Reservations', path: '/reservations' },
    { label: 'Room Status', path: '/room-status' },
  ];
  const housekeepingLinks = [
    { label: 'Room Status', path: '/room-status' },
    { label: 'Maintenance Logs', path: '/maintenance-logs' },
  ];
  const guestLinks = [
    { label: 'My Bookings', path: '/my-bookings' },
    { label: 'Profile', path: '/profile' },
    { label: 'Make Reservation', path: '/make-reservation' },
  ];

  const navItems = user
    ? (isAdmin() ? adminLinks
      : isReception() ? receptionLinks
      : isHousekeeping() ? housekeepingLinks
      : isGuest() ? guestLinks
      : common)
    : [
        { label: 'Home', path: '/' },
        { label: 'Search Reservation', path: '/search' },
        { label: 'Login', path: '/login' },
        { label: 'Signup', path: '/signup' },
      ];

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  const handleNavClick = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { sm: 'none' } }}
            onClick={toggleDrawer(true)}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Hotel Reservation System
          </Typography>

          <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 2 }}>
            {navItems.map((item) => (
              <Button key={item.label} color="inherit" onClick={() => navigate(item.path)}>
                {item.label}
              </Button>
            ))}
          </Box>

          <IconButton color="inherit" onClick={toggleMode} sx={{ mr: 1 }}>
            {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>

          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">{user.name} ({role})</Typography>
              <Button color="inherit" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
            </Box>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
              <Button color="inherit" onClick={() => navigate('/signup')}>Signup</Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250 }} role="presentation">
          <List>
            {navItems.map((item) => (
              <ListItem button key={item.label} onClick={() => handleNavClick(item.path)}>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}