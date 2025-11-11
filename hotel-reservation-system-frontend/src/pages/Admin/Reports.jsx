import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import Footer from '../../components/Footer';
import axios from 'axios';

export default function Reports() {
  const [dailyOcc, setDailyOcc] = React.useState([]);
  const [revenueByDay, setRevenueByDay] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/ReportsController.php';

  const loadReports = React.useCallback(() => {
    setLoading(true); setError('');
    Promise.all([
      axios.get(`${endpoint}?report=daily_occupancy`),
      axios.get(`${endpoint}?report=revenue_by_day`)
    ]).then(([occ, rev]) => {
      setDailyOcc(occ.data?.data || []);
      setRevenueByDay(rev.data?.data || []);
    }).catch(err => {
      console.error('Reports load error:', err?.response?.status, err?.response?.data || err);
      setError(err?.response?.data?.message || 'Failed to load reports');
    }).finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { loadReports(); }, [loadReports]);

  return (
    <Box p={3} sx={{ maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Reports</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Generate Daily Occupancy Report</Typography>
              <Button variant="contained" onClick={loadReports}>Refresh</Button>
              {loading && <Typography color="text.secondary" mt={1}>Loading...</Typography>}
              {!!error && <Typography color="error" mt={1}>{error}</Typography>}
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Hotel</TableCell>
                      <TableCell align="right">Occupied Rooms</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyOcc.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.hotel_name}</TableCell>
                        <TableCell align="right">{r.occupied_rooms}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Revenue by Day</Typography>
              <Button variant="contained" onClick={loadReports}>Refresh</Button>
              {loading && <Typography color="text.secondary" mt={1}>Loading...</Typography>}
              {!!error && <Typography color="error" mt={1}>{error}</Typography>}
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Total Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {revenueByDay.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell align="right">{r.total_revenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
