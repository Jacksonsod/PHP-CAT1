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

  // Mock stats — wire these to backend later
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

  React.useEffect(() => {
    // Seed with sample values for a good first run
    setStats({
      revenueThisMonth: 32450,
      occupancyRate: 78,
      totalBookings: 412,
      activeUsers: 96,
    });

    // Last 30 days revenue
    const today = new Date();
    const rev = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        revenue: Math.round(800 + Math.random() * 1200),
      };
    });
    setRevenueSeries(rev);

    // Pie: occupancy by room type
    setRoomTypeOccupancy([
      { name: 'Standard', value: 45 },
      { name: 'Deluxe', value: 30 },
      { name: 'Suite', value: 25 },
    ]);

    // Bar: booking sources
    setBookingSources([
      { source: 'Website', value: 180 },
      { source: 'Walk-in', value: 90 },
      { source: 'OTA', value: 120 },
      { source: 'Phone', value: 22 },
    ]);

    // Activities
    setLatestReservations([
      { id: 1, guest: 'Alice Johnson', room: '201', date: 'Today 10:15' },
      { id: 2, guest: 'Mark Lee', room: '305', date: 'Today 09:00' },
      { id: 3, guest: 'Sara Kim', room: '118', date: 'Yesterday 17:40' },
    ]);
    setPendingOps({
      checkins: [ { id: 21, guest: 'Daniel P', room: '104', eta: '14:00' } ],
      checkouts: [ { id: 37, guest: 'Mila R', room: '506', etd: '11:00' } ],
    });
    setAlerts([
      { id: 'a1', level: 'info', text: 'Backup completed successfully.' },
      { id: 'a2', level: 'warning', text: '3 rooms marked dirty pending housekeeping.' },
      { id: 'a3', level: 'error', text: 'High CPU on analytics worker.' },
    ]);
  }, []);

  const { charts, error } = useRecharts();

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
                  {error ? 'Charts unavailable (install recharts)' : 'Loading chart...'}
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
