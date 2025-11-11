import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Footer from '../../components/Footer';
import axios from 'axios';

export default function CheckOuts() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/CheckoutsController.php';

  const load = React.useCallback(() => {
    setLoading(true); setError('');
    axios.get(endpoint)
      .then(res => {
        if (res.data?.success) setRows(res.data.data || []);
        else setError(res.data?.message || 'Failed to load');
      })
      .catch(err => {
        console.error('Check-outs load error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const doCheckout = (reservationId) => {
    const data = new URLSearchParams();
    data.append('action', 'checkout');
    data.append('reservation_id', String(reservationId));
    axios.post(endpoint, data)
      .then(res => {
        if (res.data?.success) setRows(rows.filter(r => r.id !== reservationId));
        else setError(res.data?.message || 'Check-out failed');
      })
      .catch(err => {
        console.error('Check-out error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Check-out failed');
      });
  };

  return (
    <Box p={3} sx={{ maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Today's Departures</Typography>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="subtitle1">Pending Check-outs</Typography>
            </Grid>
            <Grid item>
              <Button variant="outlined" onClick={load}>Refresh</Button>
            </Grid>
          </Grid>
          {loading && <Typography color="text.secondary" mt={1}>Loading...</Typography>}
          {!!error && <Typography color="error" mt={1}>{error}</Typography>}
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Guest</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Check-Out</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{r.guest}</TableCell>
                <TableCell>{r.room}</TableCell>
                <TableCell>{r.checkOut}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="contained" onClick={() => doCheckout(r.id)}>Check-out</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={6}>
        <Footer />
      </Box>
    </Box>
  );
}
