import React from 'react';
import { Box, Grid, Card, CardContent, CardHeader, Typography, Button, List, ListItem, ListItemText, Divider } from '@mui/material';
import axios from 'axios';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

export default function GuestDashboard() {
  const { user } = useAuth();
  const email = user?.email || '';

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [upcoming, setUpcoming] = React.useState([]);
  const [current, setCurrent] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [loyalty, setLoyalty] = React.useState({ points: 0, tier: 'Bronze' });

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/GuestDashboardController.php';

  const load = React.useCallback(() => {
    if (!email) return;
    setLoading(true); setError('');
    axios.get(`${endpoint}?email=${encodeURIComponent(email)}`)
      .then(res => {
        if (res.data?.success) {
          const d = res.data.data || {};
          setUpcoming(d.upcoming || []);
          setCurrent(d.current || null);
          setHistory(d.history || []);
          setLoyalty(d.loyalty || { points: 0, tier: 'Bronze' });
        } else {
          setError(res.data?.message || 'Failed to load');
        }
      })
      .catch(err => {
        console.error('Guest dashboard load error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, [email]);

  React.useEffect(() => { load(); }, [load]);

  return (
    <Box p={3} sx={{ maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>My Dashboard</Typography>
      {!email && <Typography color="text.secondary" mb={1}>Login to see your bookings.</Typography>}
      {loading && <Typography color="text.secondary" mb={1}>Loading...</Typography>}
      {!!error && <Typography color="error" mb={1}>{error}</Typography>}

      <Grid container spacing={2}>
        {/* My Bookings */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Current Stay" />
            <CardContent>
              {current ? (
                <>
                  <Typography>{current.hotel} • Room {current.room}</Typography>
                  <Typography color="text.secondary">{current.checkIn} → {current.checkOut} • {current.status}</Typography>
                </>
              ) : (
                <Typography color="text.secondary">No active stay.</Typography>
              )}
            </CardContent>
          </Card>
          <Card sx={{ mt: 2 }}>
            <CardHeader title="Upcoming Reservations" />
            <CardContent>
              <List dense>
                {upcoming.map(b => (
                  <ListItem key={b.id} divider>
                    <ListItemText primary={`${b.hotel} • Room ${b.room}`} secondary={`${b.checkIn} → ${b.checkOut} • ${b.status}`} />
                    <Button size="small" variant="outlined">Modify</Button>
                  </ListItem>
                ))}
                {upcoming.length === 0 && <Typography color="text.secondary">No upcoming reservations.</Typography>}
              </List>
            </CardContent>
          </Card>
          <Card sx={{ mt: 2 }}>
            <CardHeader title="Booking History" />
            <CardContent>
              <List dense>
                {history.map(b => (
                  <ListItem key={b.id} divider>
                    <ListItemText primary={`${b.hotel} • Room ${b.room}`} secondary={`${b.checkIn} → ${b.checkOut} • ${b.status}`} />
                    <Button size="small">Review</Button>
                  </ListItem>
                ))}
                {history.length === 0 && <Typography color="text.secondary">No past stays.</Typography>}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Loyalty + Quick Actions + Notifications */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Loyalty Program" />
            <CardContent>
              <Typography variant="h4" fontWeight={700}>{loyalty.points}</Typography>
              <Typography color="text.secondary" mb={2}>Points • Tier: {loyalty.tier}</Typography>
              <Button variant="contained" sx={{ mr: 1, mb: 1 }}>Redeem Points</Button>
              <Button variant="outlined" sx={{ mb: 1 }}>View Offers</Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <Button fullWidth variant="contained" sx={{ mb: 1 }}>Book Another Stay</Button>
              <Button fullWidth variant="outlined" sx={{ mb: 1 }}>Modify Existing Booking</Button>
              <Button fullWidth variant="outlined">Leave a Review</Button>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardHeader title="Notifications" />
            <CardContent>
              <List dense>
                {/* In a future step, fetch notifications from backend */}
                {current && (
                  <ListItem divider>
                    <ListItemText primary="Check-in Reminder" secondary={`Your stay at ${current.hotel} starts ${current.checkIn}`} />
                  </ListItem>
                )}
                {upcoming.slice(0, 2).map(u => (
                  <ListItem key={u.id} divider>
                    <ListItemText primary="Booking Confirmation" secondary={`${u.hotel}, ${u.checkIn} → ${u.checkOut}`} />
                  </ListItem>
                ))}
                {(!current && upcoming.length === 0) && (
                  <Typography color="text.secondary">No notifications.</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={6}>
        <Footer />
      </Box>
    </Box>
  );
}
