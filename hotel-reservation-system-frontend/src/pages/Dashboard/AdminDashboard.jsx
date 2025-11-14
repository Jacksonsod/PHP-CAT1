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
  Divider,
} from '@mui/material';
import Footer from '../../components/Footer';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// A tiny helper to lazy-load Recharts at runtime without breaking the build
function useRecharts() {
  const [charts, setCharts] = React.useState(null);
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    import('recharts')
      .then((mod) => {
        if (!mounted) return;
        setCharts(mod);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e);
      });
    return () => {
      mounted = false;
    };
  }, []);
  return { charts, error };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = React.useState({
    revenueThisMonth: 0,
    occupancyRate: 0,
    totalBookings: 0,
    activeUsers: 0,
  });

  const [revenueSeries, setRevenueSeries] = React.useState([]);
  const [roomTypeOccupancy, setRoomTypeOccupancy] = React.useState([]);
  const [bookingSources, setBookingSources] = React.useState([]);

  const [latestReservations, setLatestReservations] = React.useState([]);
  const [pendingOps, setPendingOps] = React.useState({ checkins: [], checkouts: [] });
  const [alerts, setAlerts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const base = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers';
  const endpoints = {
    analytics: `${base}/AnalyticsController.php`,
    receptionStats: `${base}/ReceptionStatsController.php`,
    reservations: `${base}/ReservationsController.php`,
    users: `${base}/UsersAdminController.php`,
  };

  const load = React.useCallback(() => {
    setLoading(true); setError('');
    // Load analytics (revenue series and occupancy by type)
    const pAnalytics = axios.get(endpoints.analytics)
      .then(res => {
        if (res.data?.success) {
          const rev = (res.data.data?.revenue || []).map(r => ({
            date: r.date,
            revenue: Number(r.revenue || 0),
          }));
          setRevenueSeries(rev);
          const occ = (res.data.data?.occupancyByType || []).map(r => ({
            name: r.room_type,
            value: Number(r.occupied || 0),
          }));
          setRoomTypeOccupancy(occ);
          // Compute month-to-date revenue from returned series if dates are within current month
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const mtd = rev
            .filter(x => String(x.date).startsWith(`${yyyy}-${mm}`) || /^(\d{1,2})\/(\d{1,2})$/.test(String(x.date)))
            .reduce((sum, x) => sum + (Number(x.revenue) || 0), 0);
          setStats(s => ({ ...s, revenueThisMonth: mtd }));
        } else {
          throw new Error(res.data?.message || 'Analytics load failed');
        }
      });

    // Load today occupancy from reception stats
    const pReception = axios.get(endpoints.receptionStats)
      .then(res => {
        if (res.data?.success) {
          const occ = Number(res.data.data?.occupancy || 0);
          setStats(s => ({ ...s, occupancyRate: occ }));
        } else {
          throw new Error(res.data?.message || 'Reception stats load failed');
        }
      });

    // Load reservations list to compute counts and latest
    const pReservations = axios.get(endpoints.reservations)
      .then(res => {
        if (res.data?.success) {
          const rows = res.data.data || [];
          setStats(s => ({ ...s, totalBookings: rows.length }));
          // latest 5 by id descending (assumes API already orders desc)
          setLatestReservations(rows.slice(0, 5));
          // pending ops stubs until specific endpoints exist
          setPendingOps({ checkins: [], checkouts: [] });
        } else {
          throw new Error(res.data?.message || 'Reservations load failed');
        }
      });

    // Load users to compute count
    const pUsers = axios.get(endpoints.users)
      .then(res => {
        if (res.data?.success) {
          const rows = res.data.data || [];
          setStats(s => ({ ...s, activeUsers: rows.length }));
        } else {
          throw new Error(res.data?.message || 'Users load failed');
        }
      });

    Promise.allSettled([pAnalytics, pReception, pReservations, pUsers])
      .then(results => {
        const rejected = results.find(r => r.status === 'rejected');
        if (rejected) {
          setError(rejected.reason?.message || 'Failed to load dashboard');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const { charts, error: chartError } = useRecharts();

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
      <Typography variant="h5" fontWeight={700} mb={2}>Admin Dashboard</Typography>
      {loading && <Typography color="text.secondary" mb={1}>Loading...</Typography>}
      {!!error && <Typography color="error" mb={1}>{error}</Typography>}

      {/* Stats */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Revenue (Current Month)" value={stats.revenueThisMonth} suffix=" $" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Overall Occupancy Rate" value={stats.occupancyRate} suffix=" %" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Bookings" value={stats.totalBookings} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Active Users Count" value={stats.activeUsers} />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 360 }}>
            <CardHeader title="Revenue Trends (last 30 days)" />
            <CardContent sx={{ height: 300 }}>
              {charts ? (
                React.createElement(charts.ResponsiveContainer, { width: '100%', height: '100%' },
                  React.createElement(charts.LineChart, { data: revenueSeries },
                    React.createElement(charts.CartesianGrid, { strokeDasharray: '3 3' }),
                    React.createElement(charts.XAxis, { dataKey: 'date' }),
                    React.createElement(charts.YAxis, null),
                    React.createElement(charts.Tooltip, null),
                    React.createElement(charts.Legend, null),
                    React.createElement(charts.Line, { type: 'monotone', dataKey: 'revenue', stroke: '#1976d2', strokeWidth: 2 })
                  )
                )
              ) : (
                <Typography color="text.secondary">
                  {chartError ? 'Charts unavailable (install recharts)' : 'Loading chart...'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: 360 }}>
            <CardHeader title="Occupancy by Room Type" />
            <CardContent sx={{ height: 300 }}>
              {charts ? (
                React.createElement(charts.ResponsiveContainer, { width: '100%', height: '100%' },
                  React.createElement(charts.PieChart, null,
                    React.createElement(charts.Pie, {
                      data: roomTypeOccupancy,
                      dataKey: 'value',
                      nameKey: 'name',
                      outerRadius: 100,
                      label: true,
                    })
                  )
                )
              ) : (
                <Typography color="text.secondary">
                  {error ? 'Charts unavailable (install recharts)' : 'Loading chart...'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Booking Sources" />
            <CardContent sx={{ height: 300 }}>
              {charts ? (
                React.createElement(charts.ResponsiveContainer, { width: '100%', height: '100%' },
                  React.createElement(charts.BarChart, { data: bookingSources },
                    React.createElement(charts.CartesianGrid, { strokeDasharray: '3 3' }),
                    React.createElement(charts.XAxis, { dataKey: 'source' }),
                    React.createElement(charts.YAxis, null),
                    React.createElement(charts.Tooltip, null),
                    React.createElement(charts.Legend, null),
                    React.createElement(charts.Bar, { dataKey: 'value', fill: '#9c27b0' })
                  )
                )
              ) : (
                <Typography color="text.secondary">
                  {error ? 'Charts unavailable (install recharts)' : 'Loading chart...'}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Latest Reservations" />
            <CardContent>
              <List dense>
                {latestReservations.map((r) => (
                  <ListItem key={r.id} divider>
                    <ListItemText primary={`${r.guest} • Room ${r.room}`} secondary={r.date} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Pending Check-ins / Check-outs" />
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Check-ins</Typography>
              <List dense>
                {pendingOps.checkins.map((c) => (
                  <ListItem key={c.id} divider>
                    <ListItemText primary={`${c.guest} • Room ${c.room}`} secondary={`ETA ${c.eta}`} />
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>Check-outs</Typography>
              <List dense>
                {pendingOps.checkouts.map((c) => (
                  <ListItem key={c.id} divider>
                    <ListItemText primary={`${c.guest} • Room ${c.room}`} secondary={`ETD ${c.etd}`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="System Alerts" />
            <CardContent>
              <List dense>
                {alerts.map((a) => (
                  <ListItem key={a.id} divider>
                    <ListItemText primary={a.text} secondary={a.level.toUpperCase()} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Button fullWidth variant="contained" onClick={() => navigate('/hotels')}>Add New Hotel</Button>
                </Grid>
                <Grid item xs={12}>
                  <Button fullWidth variant="outlined" onClick={() => navigate('/reports')}>Generate Reports</Button>
                </Grid>
                <Grid item xs={12}>
                  <Button fullWidth variant="outlined" onClick={() => navigate('/audit-logs')}>View Audit Logs</Button>
                </Grid>
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
