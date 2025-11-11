import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Button } from '@mui/material';
import Footer from '../../components/Footer';
import axios from 'axios';

export default function RoomStatus() {
  const [rooms, setRooms] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/RoomStatusController.php';

  const load = React.useCallback(() => {
    setLoading(true); setError('');
    axios.get(endpoint)
      .then(res => {
        if (res.data?.success) setRooms(res.data.data || []);
        else setError(res.data?.message || 'Failed to load room statuses');
      })
      .catch(err => {
        console.error('Room status load error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load room statuses');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const setStatus = (id, status) => {
    const data = new URLSearchParams();
    data.append('action', 'update_status');
    data.append('id', String(id));
    data.append('status', status);
    axios.post(endpoint, data)
      .then(res => {
        if (res.data?.success) setRooms(rooms.map(r => r.id === id ? { ...r, status } : r));
        else setError(res.data?.message || 'Update failed');
      })
      .catch(err => {
        console.error('Update status error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Update failed');
      });
  };

  const color = (s) => s === 'available' ? 'success' : s === 'occupied' ? 'primary' : s === 'dirty' ? 'warning' : 'error';

  return (
    <Box p={3} sx={{ maxWidth: 1200, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Room Status</Typography>
      {loading && <Typography color="text.secondary" mt={1}>Loading...</Typography>}
      {!!error && <Typography color="error" mt={1}>{error}</Typography>}

      <Grid container spacing={2} justifyContent="center">
        {rooms.map((r) => (
          <Grid item key={r.id}>
            <Card sx={{ minWidth: 180 }}>
              <CardContent>
                <Typography variant="subtitle2">{r.hotel} • Room {r.number}</Typography>
                <Chip label={r.status} color={color(r.status)} size="small" sx={{ mt: 1, mb: 2 }} />
                <Grid container spacing={1} justifyContent="center">
                  <Grid item><Button size="small" onClick={() => setStatus(r.id, 'available')}>Available</Button></Grid>
                  <Grid item><Button size="small" onClick={() => setStatus(r.id, 'dirty')}>Dirty</Button></Grid>
                  <Grid item><Button size="small" onClick={() => setStatus(r.id, 'maintenance')}>Maintenance</Button></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={6}>
        <Footer />
      </Box>
    </Box>
  );
}
