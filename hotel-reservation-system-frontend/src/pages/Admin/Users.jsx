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

export default function Users() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', email: '', role: 'guest' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/UsersAdminController.php';

  const fetchUsers = React.useCallback(() => {
    setLoading(true);
    setError('');
    axios.get(endpoint)
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRows(res.data.data);
        } else {
          setError(res.data?.message || 'Failed to load users');
        }
      })
      .catch(err => {
        console.error('Fetch users error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Failed to load users');
      })
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const startAdd = () => { setEditing(null); setForm({ name: '', email: '', role: 'guest' }); setOpen(true); };
  const startEdit = (row) => { setEditing(row); setForm({ name: row.name, email: row.email, role: row.role }); setOpen(true); };
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
        console.error('Delete user error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Delete failed');
      });
  };

  const save = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    const isUpdate = Boolean(editing?.id);
    const data = new URLSearchParams();
    data.append('action', isUpdate ? 'update' : 'create');
    if (isUpdate) data.append('id', String(editing.id));
    data.append('name', form.name.trim());
    data.append('email', form.email.trim());
    data.append('role', form.role);

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
          setForm({ name: '', email: '', role: 'guest' });
        } else {
          setError(res.data?.message || 'Save failed');
        }
      })
      .catch(err => {
        console.error('Save user error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Save failed');
      });
  };

  return (
    <Box p={3} sx={{ maxWidth: 1100, mx: 'auto', textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={700} mb={2}>Manage Users</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Typography variant="subtitle1">Users</Typography>
            </Grid>
            <Grid item>
              <Button variant="contained" startIcon={<AddIcon />} onClick={startAdd}>Add User</Button>
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
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.role}</TableCell>
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
        <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <MenuItem value="guest">guest</MenuItem>
              <MenuItem value="reception">reception</MenuItem>
              <MenuItem value="housekeeping">housekeeping</MenuItem>
              <MenuItem value="admin">admin</MenuItem>
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
