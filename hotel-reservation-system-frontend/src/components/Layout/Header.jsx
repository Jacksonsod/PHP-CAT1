import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function LayoutHeader() {
  const { user, role, logout, isAdmin, isReception, isHousekeeping, isGuest } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = React.useState(() => localStorage.getItem('ui:mode') || 'light');

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('ui:mode', next);
    document.documentElement.dataset.theme = next;
  };

  const actions = isAdmin()
    ? [ { label: 'Users', path: '/users' }, { label: 'Reports', path: '/reports' } ]
    : isReception()
      ? [ { label: 'Check-ins', path: '/checkins' }, { label: 'Check-outs', path: '/checkouts' } ]
      : isHousekeeping()
        ? [ { label: 'Room Status', path: '/room-status' } ]
        : isGuest()
          ? [ { label: 'Make Reservation', path: '/make-reservation' } ]
          : [];

  return (
    <AppBar position="static" color="default">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {user ? `${user.name} (${role})` : 'Welcome'}
        </Typography>

        <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 2 }}>
          {actions.map((a) => (
            <Button key={a.label} onClick={() => navigate(a.path)}>{a.label}</Button>
          ))}
        </Box>

        <IconButton color="inherit" onClick={toggleMode} sx={{ mr: 1 }}>
          {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
        </IconButton>

        {user ? (
          <Button color="inherit" onClick={() => { logout(); navigate('/'); }}>Logout</Button>
        ) : (
          <>
            <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
            <Button color="inherit" onClick={() => navigate('/signup')}>Signup</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
