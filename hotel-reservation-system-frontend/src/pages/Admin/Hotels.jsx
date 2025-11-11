import React from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Footer from '../../components/Footer';
import axios from 'axios';

export default function Hotels() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', location: '', description: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/HotelsController.php';

  const fetchHotels = React.useCallback(() => {
    setLoading(true);
    setError('');
    axios.get(endpoint)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRows(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load hotels');
        }
      })
      .catch(err => {
        console.error('Fetch hotels error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load hotels');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { fetchHotels(); }, [fetchHotels]);

  const startAdd = () => { setEditing(null); setForm({ name: '', location: '', description: '' }); setOpen(true); };
  const startEdit = (row) => { setEditing(row); setForm({ name: row.name, location: row.location, description: row.description }); setOpen(true); };
  const remove = (id) => {
    const formData = new URLSearchParams();
    formData.append('action', 'delete');
    formData.append('id', String(id));
    axios.post(endpoint, formData)
      .then(res => {
        if (res.data?.success) {
          setRows(rows.filter(r => r.id !== id));
        } else {
          setError(res.data?.message || 'Delete failed');
        }
      })
      .catch(err => {
        console.error('Delete hotel error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Delete failed');
      });
  };

  const save = () => {
    if (!form.name.trim() || !form.location.trim()) return;
    const isUpdate = Boolean(editing?.id);
    const formData = new URLSearchParams();
    formData.append('action', isUpdate ? 'update' : 'create');
    if (isUpdate) formData.append('id', String(editing.id));
    formData.append('name', form.name.trim());
    formData.append('location', form.location.trim());
    formData.append('description', form.description.trim());

    axios.post(endpoint, formData)
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
          setForm({ name: '', location: '', description: '' });
        } else {
          setError(res.data?.message || 'Save failed');
        }
      })
      .catch(err => {
        console.error('Save hotel error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Save failed');
      });
  };

  return (
    <Box p={3} sx={{ maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Manage Hotels</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="subtitle1">Hotels</Typography>
            </Grid>
            <Grid item>
              <Button variant="contained" startIcon={<AddIcon />} onClick={startAdd}>Add New Hotel</Button>
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
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.location}</TableCell>
                <TableCell>{row.description}</TableCell>
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
        <DialogTitle>{editing ? 'Edit Hotel' : 'Add Hotel'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} />
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
