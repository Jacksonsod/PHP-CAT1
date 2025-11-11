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

export default function Rooms() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ hotel: '', number: '', type: 'Standard', price: 0, status: 'available' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/RoomsController.php';

  const fetchRooms = React.useCallback(() => {
    setLoading(true);
    setError('');
    axios.get(endpoint)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRows(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load rooms');
        }
      })
      .catch(err => {
        console.error('Fetch rooms error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load rooms');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const startAdd = () => { setEditing(null); setForm({ hotel: '', number: '', type: 'Standard', price: 0, status: 'available' }); setOpen(true); };
  const startEdit = (row) => { setEditing(row); setForm({ hotel: row.hotel, number: row.number, type: row.type, price: row.price, status: row.status }); setOpen(true); };
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
        console.error('Delete room error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Delete failed');
      });
  };

  const save = () => {
    if (!form.hotel.trim() || !form.number.trim()) return;
    const isUpdate = Boolean(editing?.id);
    const data = new URLSearchParams();
    data.append('action', isUpdate ? 'update' : 'create');
    if (isUpdate) data.append('id', String(editing.id));
    // allow backend to resolve hotel_id from hotel name
    data.append('hotel', form.hotel.trim());
    data.append('number', form.number.trim());
    data.append('type', form.type);
    data.append('price', String(form.price));
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
          setForm({ hotel: '', number: '', type: 'Standard', price: 0, status: 'available' });
        } else {
          setError(res.data?.message || 'Save failed');
        }
      })
      .catch(err => {
        console.error('Save room error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Save failed');
      });
  };

  return (
    <Box p={3} sx={{ maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Manage Rooms</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="subtitle1">Rooms</Typography>
            </Grid>
            <Grid item>
              <Button variant="contained" startIcon={<AddIcon />} onClick={startAdd}>Add Room</Button>
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
              <TableCell>Hotel</TableCell>
              <TableCell>Number</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.hotel}</TableCell>
                <TableCell>{row.number}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>${row.price}</TableCell>
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
        <DialogTitle>{editing ? 'Edit Room' : 'Add Room'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Hotel" value={form.hotel} onChange={(e) => setForm({ ...form, hotel: e.target.value })} required />
            <TextField label="Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required />
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <MenuItem value="Standard">Standard</MenuItem>
              <MenuItem value="Deluxe">Deluxe</MenuItem>
              <MenuItem value="Suite">Suite</MenuItem>
            </Select>
            <TextField label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <MenuItem value="available">available</MenuItem>
              <MenuItem value="occupied">occupied</MenuItem>
              <MenuItem value="dirty">dirty</MenuItem>
              <MenuItem value="maintenance">maintenance</MenuItem>
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
