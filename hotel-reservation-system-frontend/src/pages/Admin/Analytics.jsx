import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import Footer from '../../components/Footer';
import axios from 'axios';

function useRecharts() {
  const [charts, setCharts] = React.useState(null);
  const [error, setError] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    import('recharts')
      .then((mod) => { if (mounted) setCharts(mod); })
      .catch((e) => { if (mounted) setError(e); });
    return () => { mounted = false; };
  }, []);
  return { charts, error };
}

export default function Analytics() {
  const { charts, error: chartError } = useRecharts();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [revenue, setRevenue] = React.useState([]);
  const [occupancyByType, setOccupancyByType] = React.useState([]);

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/AnalyticsController.php';

  const load = React.useCallback(() => {
    setLoading(true); setError('');
    axios.get(endpoint)
      .then(res => {
        if (res.data?.success) {
          setRevenue(res.data.data?.revenue || []);
          setOccupancyByType(res.data.data?.occupancyByType || []);
        } else {
          setError(res.data?.message || 'Failed to load analytics');
        }
      })
      .catch(err => {
        console.error('Analytics load error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load analytics');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <Box p={3} sx={{ maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Analytics</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ height: 300 }}>
              <Typography variant="subtitle1" gutterBottom>Occupancy by Room Type (Today)</Typography>
              {!charts ? (
                <Typography color="text.secondary">{chartError ? 'Charts unavailable (install recharts)' : 'Loading chart...'}</Typography>
              ) : loading ? (
                <Typography color="text.secondary">Loading...</Typography>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : (
                React.createElement(charts.ResponsiveContainer, { width: '100%', height: '100%' },
                  React.createElement(charts.PieChart, null,
                    React.createElement(charts.Pie, {
                      data: occupancyByType.map(r => ({ name: r.room_type, value: Number(r.occupied) })),
                      dataKey: 'value',
                      nameKey: 'name',
                      outerRadius: 100,
                      label: true,
                    })
                  )
                )
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 360 }}>
            <CardContent sx={{ height: 300 }}>
              <Typography variant="subtitle1" gutterBottom>Revenue (Last 30 Days)</Typography>
              {!charts ? (
                <Typography color="text.secondary">{chartError ? 'Charts unavailable (install recharts)' : 'Loading chart...'}</Typography>
              ) : loading ? (
                <Typography color="text.secondary">Loading...</Typography>
              ) : error ? (
                <Typography color="error">{error}</Typography>
              ) : (
                React.createElement(charts.ResponsiveContainer, { width: '100%', height: '100%' },
                  React.createElement(charts.LineChart, { data: revenue.map(r => ({ date: r.date, revenue: Number(r.revenue) })) },
                    React.createElement(charts.CartesianGrid, { strokeDasharray: '3 3' }),
                    React.createElement(charts.XAxis, { dataKey: 'date' }),
                    React.createElement(charts.YAxis, null),
                    React.createElement(charts.Tooltip, null),
                    React.createElement(charts.Legend, null),
                    React.createElement(charts.Line, { type: 'monotone', dataKey: 'revenue', stroke: '#1976d2', strokeWidth: 2 })
                  )
                )
              )}
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
