import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import Footer from '../../components/Footer';
import axios from 'axios';

export default function ReceptionDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = React.useState({ arrivals: 0, departures: 0, occupancy: 0 });
  const [pendingCheckins, setPendingCheckins] = React.useState([]);
  const [pendingCheckouts, setPendingCheckouts] = React.useState([]);
  const [specialRequests] = React.useState([]); // hook up when feature exists
  const [roomStatus, setRoomStatus] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const base = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers';
  const endpoints = {
    stats: `${base}/ReceptionStatsController.php`,
    checkins: `${base}/CheckinsController.php`,
    checkouts: `${base}/CheckoutsController.php`,
    roomStatus: `${base}/RoomStatusController.php`,
  };

  const loadAll = React.useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([
      axios.get(endpoints.stats),
      axios.get(endpoints.checkins),
      axios.get(endpoints.checkouts),
      axios.get(endpoints.roomStatus),
    ])
      .then(([statsRes, ciRes, coRes, rsRes]) => {
        const stats = statsRes.data?.data || {};
        setOverview({
          arrivals: stats.arrivals || 0,
          departures: stats.departures || 0,
          occupancy: stats.occupancy || 0,
        });
        setPendingCheckins(ciRes.data?.data || []);
        setPendingCheckouts(coRes.data?.data || []);
        setRoomStatus(rsRes.data?.data || []);
      })
      .catch((err) => {
        console.error('Reception dashboard load error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load dashboard');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { loadAll(); }, [loadAll]);

  const statusColor = (s) => {
    const v = String(s || '').toLowerCase();
    return v === 'available'
      ? 'success'
      : v === 'occupied'
      ? 'primary'
      : v === 'dirty' || v === 'cleaning'
      ? 'warning'
      : 'error';
  };

  const prettyStatus = (s) => {
    const v = String(s || '').toLowerCase();
    if (v === 'dirty') return 'Cleaning';
    return v.charAt(0).toUpperCase() + v.slice(1);
  };

  const StatCard = ({ title, value, suffix }) => (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
        <Typography variant="h4" fontWeight={700} mt={1}>
          {Intl.NumberFormat().format(value)}{suffix || ''}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box p={3} sx={{ maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Reception Dashboard</Typography>
      {loading && <Typography color="text.secondary" mb={1}>Loading...</Typography>}
      {!!error && <Typography color="error" mb={1}>{error}</Typography>}

      {/* Today's Overview */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Arrivals Today" value={overview.arrivals} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Departures Today" value={overview.departures} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Current Occupancy" value={overview.occupancy} suffix=" %" />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 2 }}>
        <CardHeader title="Quick Actions" />
        <CardContent>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button variant="contained" onClick={() => navigate('/reservations')}>Quick Check-in</Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={() => navigate('/reservations')}>Quick Check-out</Button>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={() => navigate('/reservations')}>New Walk-in Reservation</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Pending Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Pending Check-ins" />
            <CardContent>
              <List dense>
                {pendingCheckins.map((i) => (
                  <ListItem key={i.id} divider>
                    <ListItemText primary={`${i.guest} • Room ${i.room}`} secondary={`Check-in ${i.checkIn || ''}`} />
                    <Button size="small" variant="contained" onClick={() => navigate('/reservations')}>Check-in</Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
          <Card sx={{ mt: 2 }}>
            <CardHeader title="Pending Check-outs" />
            <CardContent>
              <List dense>
                {pendingCheckouts.map((o) => (
                  <ListItem key={o.id} divider>
                    <ListItemText primary={`${o.guest} • Room ${o.room}`} secondary={`Check-out ${o.checkOut || ''}`} />
                    <Button size="small" variant="outlined" onClick={() => navigate('/reservations')}>Check-out</Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
          <Card sx={{ mt: 2 }}>
            <CardHeader title="Special Requests" />
            <CardContent>
              <List dense>
                {specialRequests.map((r) => (
                  <ListItem key={r.id} divider>
                    <ListItemText primary={`${r.type}`} secondary={`${r.guest} • Room ${r.room}`} />
                    <Button size="small">View</Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Room Status Grid */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Room Status" />
            <CardContent>
              <Grid container spacing={1} justifyContent="center">
                {roomStatus.map((r, idx) => (
                  <Grid item key={idx}>
                    <Card sx={{ minWidth: 120 }}>
                      <CardContent>
                        <Typography variant="subtitle2">{r.hotel} • Room {r.number}</Typography>
                        <Chip label={prettyStatus(r.status)} color={statusColor(r.status)} size="small" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1} justifyContent="center">
                <Grid item><Chip label="Available" color="success" size="small" /></Grid>
                <Grid item><Chip label="Occupied" color="primary" size="small" /></Grid>
                <Grid item><Chip label="Cleaning" color="warning" size="small" /></Grid>
                <Grid item><Chip label="Maintenance" color="error" size="small" /></Grid>
              </Grid>
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
