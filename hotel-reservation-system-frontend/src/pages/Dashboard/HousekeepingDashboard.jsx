import React from 'react';
import { Box, Grid, Card, CardContent, CardHeader, Typography, Button, List, ListItem, ListItemText, Chip } from '@mui/material';
import Footer from '../../components/Footer';
import axios from 'axios';

export default function HousekeepingDashboard() {
  const [dirtyRooms, setDirtyRooms] = React.useState([]);
  const [maintenanceRooms, setMaintenanceRooms] = React.useState([]);
  const [recentlyCleaned, setRecentlyCleaned] = React.useState([]);
  const [stats, setStats] = React.useState({ efficiency: 0, cleanedToday: 0, pendingTasks: 0 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const base = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers';
  const endpoints = {
    roomStatus: `${base}/RoomStatusController.php`,
    hkStats: `${base}/HousekeepingController.php`,
  };

  const load = React.useCallback(() => {
    setLoading(true); setError('');
    Promise.all([
      axios.get(endpoints.roomStatus),
      axios.get(endpoints.hkStats),
    ]).then(([rs, st]) => {
      const allRooms = rs.data?.data || [];
      setDirtyRooms(allRooms.filter(r => String(r.status).toLowerCase() === 'dirty'));
      setMaintenanceRooms(allRooms.filter(r => String(r.status).toLowerCase() === 'maintenance'));
      setRecentlyCleaned(allRooms.filter(r => String(r.status).toLowerCase() === 'available').slice(0, 10));
      const s = st.data?.data || {};
      setStats({ efficiency: s.efficiency || 0, cleanedToday: s.cleanedToday || 0, pendingTasks: s.pendingTasks || 0 });
    }).catch(err => {
      console.error('Housekeeping load error:', err?.response?.status, err?.response?.data || err);
      setError(err?.response?.data?.message || 'Failed to load housekeeping');
    }).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const updateStatus = (id, status) => {
    const data = new URLSearchParams();
    data.append('action', 'update_status');
    data.append('id', String(id));
    data.append('status', status);
    axios.post(endpoints.roomStatus, data)
      .then(res => {
        if (res.data?.success) load();
      })
      .catch(err => console.error('Update status error:', err?.response?.status, err?.response?.data || err));
  };

  const StatCard = ({ title, value, suffix }) => (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
        <Typography variant="h4" fontWeight={700} mt={1}>{value}{suffix || ''}</Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box p={3} sx={{ maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Housekeeping Dashboard</Typography>
      {loading && <Typography color="text.secondary" mb={1}>Loading...</Typography>}
      {!!error && <Typography color="error" mb={1}>{error}</Typography>}

      {/* Stats */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}><StatCard title="Cleaning Efficiency" value={stats.efficiency} suffix=" %" /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Rooms Cleaned Today" value={stats.cleanedToday} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Pending Tasks" value={stats.pendingTasks} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Rooms needing cleaning */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Rooms Needing Cleaning" />
            <CardContent>
              <List dense>
                {dirtyRooms.map(r => (
                  <ListItem key={r.id} divider secondaryAction={
                    <>
                      <Button size="small" onClick={() => updateStatus(r.id, 'available')}>Mark Cleaned</Button>
                      <Button size="small" onClick={() => updateStatus(r.id, 'maintenance')}>Report Issue</Button>
                    </>
                  }>
                    <ListItemText primary={`${r.hotel} • Room ${r.number}`} secondary={`Type: ${r.type}`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Rooms under maintenance */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Under Maintenance" />
            <CardContent>
              <List dense>
                {maintenanceRooms.map(r => (
                  <ListItem key={r.id} divider secondaryAction={
                    <Button size="small" onClick={() => updateStatus(r.id, 'dirty')}>Mark Ready to Clean</Button>
                  }>
                    <ListItemText primary={`${r.hotel} • Room ${r.number}`} secondary={`Type: ${r.type}`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recently cleaned rooms */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Recently Cleaned" />
            <CardContent>
              <List dense>
                {recentlyCleaned.map(r => (
                  <ListItem key={r.id} divider>
                    <ListItemText primary={`${r.hotel} • Room ${r.number}`} secondary={`Type: ${r.type}`} />
                    <Chip size="small" label="Available" color="success" />
                  </ListItem>
                ))}
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
