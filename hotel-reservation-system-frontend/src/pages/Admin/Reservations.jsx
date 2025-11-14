import React from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Footer from '../../components/Footer';
import axios from 'axios';

export default function Reservations() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ guest: '', room: '', checkIn: '', checkOut: '', status: 'pending' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [guests, setGuests] = React.useState([]);
  const [rooms, setRooms] = React.useState([]);

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/ReservationsController.php';
  const usersEndpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/UsersAdminController.php';
  const roomsEndpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/RoomsController.php';

  const fetchReservations = React.useCallback(() => {
    setLoading(true);
    setError('');
    axios.get(endpoint)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRows(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load reservations');
        }
      })
      .catch(err => {
        console.error('Fetch reservations error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load reservations');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { fetchReservations(); }, [fetchReservations]);

  React.useEffect(() => {
    axios.get(usersEndpoint)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setGuests(res.data.data);
        }
      })
      .catch(err => {
        console.error('Fetch guests error:', err?.response?.status, err?.response?.data || err);
      });

    axios.get(roomsEndpoint)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRooms(res.data.data);
        }
      })
      .catch(err => {
        console.error('Fetch rooms error:', err?.response?.status, err?.response?.data || err);
      });
  }, []);

  const startAdd = () => { setEditing(null); setForm({ guest: '', room: '', checkIn: '', checkOut: '', status: 'pending' }); setOpen(true); };
  const startEdit = (row) => { setEditing(row); setForm({ guest: row.guest, room: row.room, checkIn: row.checkIn, checkOut: row.checkOut, status: row.status }); setOpen(true); };
  const remove = (id) => {
    const data = new URLSearchParams();
    data.append('action', 'delete');
    data.append('id', String(id));
    axios.post(endpoint, data)
      .then(res => {
        if (res.data?.success) setRows(rows.filter(r => r.id !== id));
        else setError(res.data?.message || 'Delete failed');
      })
      .catch(err => {
        console.error('Delete reservation error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Delete failed');
      });
  };

  const save = () => {
    if (!form.guest.trim() || !form.room.trim() || !form.checkIn || !form.checkOut) return;
    const isUpdate = Boolean(editing?.id);
    const data = new URLSearchParams();
    data.append('action', isUpdate ? 'update' : 'create');
    if (isUpdate) data.append('id', String(editing.id));
    data.append('guest', form.guest.trim());
    data.append('room', form.room.trim());
    data.append('checkIn', form.checkIn);
    data.append('checkOut', form.checkOut);
    data.append('status', form.status);

    axios.post(endpoint, data)
      .then(res => {
        if (res.data?.success) {
          if (isUpdate) {
            setRows(rows.map(r => r.id === editing.id ? { ...r, ...form } : r));
          } else {
            const id = res.data.id;
            setRows([{ id, ...form }, ...rows]);
          }
          setOpen(false);
          setEditing(null);
          setForm({ guest: '', room: '', checkIn: '', checkOut: '', status: 'pending' });
        } else {
          setError(res.data?.message || 'Save failed');
        }
      })
      .catch(err => {
        console.error('Save reservation error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Save failed');
      });
  };

  return (
    <Box p={3} sx={{ maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Manage Reservations</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="subtitle1">Reservations</Typography>
            </Grid>
            <Grid item>
              <Button variant="contained" startIcon={<AddIcon />} onClick={startAdd}>Add Reservation</Button>
            </Grid>
          </Grid>
          {loading && (
            <Typography color="text.secondary" mt={1}>Loading...</Typography>
          )}
          {!!error && (
            <Typography color="error" mt={1}>{error}</Typography>
          )}
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Guest</TableCell>
              <TableCell>Room</TableCell>
              <TableCell>Check-In</TableCell>
              <TableCell>Check-Out</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.guest}</TableCell>
                <TableCell>{row.room}</TableCell>
                <TableCell>{row.checkIn}</TableCell>
                <TableCell>{row.checkOut}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => startEdit(row)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => remove(row.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Reservation' : 'Add Reservation'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <Select
              displayEmpty
              value={form.guest}
              onChange={(e) => setForm({ ...form, guest: e.target.value })}
            >
              <MenuItem value="" disabled>Select Guest</MenuItem>
              {guests.map((g) => (
                <MenuItem key={g.id} value={g.name}>{g.name}</MenuItem>
              ))}
            </Select>
            <Select
              displayEmpty
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            >
              <MenuItem value="" disabled>Select Room</MenuItem>
              {rooms.map((r) => (
                <MenuItem key={r.id} value={r.number}>{r.number} - {r.hotel} ({r.status})</MenuItem>
              ))}
            </Select>
            <TextField label="Check-In" type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} InputLabelProps={{ shrink: true }} required />
            <TextField label="Check-Out" type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} InputLabelProps={{ shrink: true }} required />
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="pending">pending</MenuItem>
              <MenuItem value="confirmed">confirmed</MenuItem>
              <MenuItem value="checked_in">checked_in</MenuItem>
              <MenuItem value="checked_out">checked_out</MenuItem>
              <MenuItem value="cancelled">cancelled</MenuItem>
            </Select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>{editing ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Box mt={6}>
        <Footer />
      </Box>
    </Box>
  );
}
