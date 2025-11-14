import React from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem,
  Checkbox, TablePagination, Toolbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Footer from '../../components/Footer';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

export default function Users() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', email: '', role: 'guest' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selected, setSelected] = React.useState([]);

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/UsersAdminController.php';

  const toast = useToast();

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
        if (res.data?.success) {
          setRows(rows.filter(r => r.id !== id));
          setSelected(prev => prev.filter(x => x !== id));
          toast.success('User deleted');
        } else {
          setError(res.data?.message || 'Delete failed');
          toast.error(res.data?.message || 'Delete failed');
        }
      })
      .catch(err => {
        console.error('Delete user error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Delete failed');
        toast.error(err?.response?.data?.message || 'Delete failed');
      });
  };

  const removeSelected = () => {
    if (!selected.length) return;
    const toDelete = [...selected];
    Promise.all(toDelete.map(id => {
      const data = new URLSearchParams();
      data.append('action', 'delete');
      data.append('id', String(id));
      return axios.post(endpoint, data);
    }))
      .then(() => {
        setRows(rows.filter(r => !toDelete.includes(r.id)));
        setSelected([]);
        toast.success('Selected users deleted');
      })
      .catch(err => {
        console.error('Bulk delete users error:', err?.response?.status, err?.response?.data || err);
        toast.error('Failed to delete some users');
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
            toast.success('User updated');
          } else {
            const id = res.data.id;
            setRows([{ id, ...form }, ...rows]);
            toast.success('User created');
          }
          setOpen(false);
          setEditing(null);
          setForm({ name: '', email: '', role: 'guest' });
        } else {
          setError(res.data?.message || 'Save failed');
          toast.error(res.data?.message || 'Save failed');
        }
      })
      .catch(err => {
        console.error('Save user error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Save failed');
        toast.error(err?.response?.data?.message || 'Save failed');
      });
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredRows.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleRowClick = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  };

  const isSelected = (id) => selected.includes(id);

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredRows = rows.filter((row) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term ||
      String(row.id).includes(term) ||
      String(row.name || '').toLowerCase().includes(term) ||
      String(row.email || '').toLowerCase().includes(term);
    const matchesRole = !roleFilter || row.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
          <Toolbar sx={{ justifyContent: 'space-between', px: 0, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                label="Search by name / email / ID"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
              <Select
                size="small"
                value={roleFilter}
                displayEmpty
                onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="">All roles</MenuItem>
                <MenuItem value="guest">guest</MenuItem>
                <MenuItem value="reception">reception</MenuItem>
                <MenuItem value="housekeeping">housekeeping</MenuItem>
                <MenuItem value="admin">admin</MenuItem>
              </Select>
            </Box>
            <Button
              color="error"
              variant="outlined"
              disabled={!selected.length}
              onClick={removeSelected}
            >
              Delete selected ({selected.length})
            </Button>
          </Toolbar>
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
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < filteredRows.length}
                  checked={filteredRows.length > 0 && selected.length === filteredRows.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all users' }}
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => {
              const selectedRow = isSelected(row.id);
              return (
              <TableRow
                key={row.id}
                hover
                role="checkbox"
                aria-checked={selectedRow}
                selected={selectedRow}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    checked={selectedRow}
                    onChange={() => handleRowClick(row.id)}
                  />
                </TableCell>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.role}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => startEdit(row)}><EditIcon /></IconButton>
                  <IconButton size="small" color="error" onClick={() => remove(row.id)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            );})}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredRows.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

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
