import React from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Checkbox, TablePagination, Toolbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Footer from '../../components/Footer';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

export default function Hotels() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', location: '', description: '', image: null });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selected, setSelected] = React.useState([]);

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/HotelsController.php';

  const toast = useToast();

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

  const startAdd = () => { setEditing(null); setForm({ name: '', location: '', description: '', image: null }); setOpen(true); };
  const startEdit = (row) => { setEditing(row); setForm({ name: row.name, location: row.location, description: row.description, image: null }); setOpen(true); };
  const remove = (id) => {
    const formData = new URLSearchParams();
    formData.append('action', 'delete');
    formData.append('id', String(id));
    axios.post(endpoint, formData)
      .then(res => {
        if (res.data?.success) {
          setRows(rows.filter(r => r.id !== id));
          setSelected(prev => prev.filter(x => x !== id));
          toast.success('Hotel deleted');
        } else {
          setError(res.data?.message || 'Delete failed');
          toast.error(res.data?.message || 'Delete failed');
        }
      })
      .catch(err => {
        console.error('Delete hotel error:', err?.response?.status, err?.response?.data || err);
        setError(err?.response?.data?.message || 'Delete failed');
        toast.error(err?.response?.data?.message || 'Delete failed');
      });
  };

  const removeSelected = () => {
    if (!selected.length) return;
    const toDelete = [...selected];
    Promise.all(toDelete.map(id => {
      const formData = new URLSearchParams();
      formData.append('action', 'delete');
      formData.append('id', String(id));
      return axios.post(endpoint, formData);
    }))
      .then(() => {
        setRows(rows.filter(r => !toDelete.includes(r.id)));
        setSelected([]);
        toast.success('Selected hotels deleted');
      })
      .catch(err => {
        console.error('Bulk delete hotels error:', err?.response?.status, err?.response?.data || err);
        toast.error('Failed to delete some hotels');
      });
  };

  const save = () => {
    if (!form.name.trim() || !form.location.trim()) return;
    const isUpdate = Boolean(editing?.id);

    const formData = new FormData();
    formData.append('action', isUpdate ? 'update' : 'create');
    if (isUpdate) formData.append('id', String(editing.id));
    formData.append('name', form.name.trim());
    formData.append('location', form.location.trim());
    formData.append('description', form.description.trim());

    if (form.image) {
      formData.append('image', form.image);
    }

    axios.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(res => {
        if (res.data?.success) {
          if (isUpdate) {
            setRows(rows.map(r => r.id === editing.id ? { ...r, name: form.name, location: form.location, description: form.description } : r));
            toast.success('Hotel updated');
          } else {
            const id = res.data.id;
            setRows([{ id, name: form.name, location: form.location, description: form.description }, ...rows]);
            toast.success('Hotel created');
          }
          setOpen(false);
          setEditing(null);
          setForm({ name: '', location: '', description: '', image: null });
        } else {
          setError(res.data?.message || 'Save failed');
          toast.error(res.data?.message || 'Save failed');
        }
      })
      .catch(err => {
        console.error('Save hotel error:', err?.response?.status, err?.response?.data || err);
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
    if (!term) return true;
    return (
      String(row.id).includes(term) ||
      String(row.name || '').toLowerCase().includes(term) ||
      String(row.location || '').toLowerCase().includes(term) ||
      String(row.description || '').toLowerCase().includes(term)
    );
  });

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
          <Toolbar sx={{ justifyContent: 'space-between', px: 0, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                label="Search by name / location / ID"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
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
                  inputProps={{ 'aria-label': 'select all hotels' }}
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Description</TableCell>
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
                <TableCell>{row.location}</TableCell>
                <TableCell>{row.description}</TableCell>
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
        <DialogTitle>{editing ? 'Edit Hotel' : 'Add Hotel'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <TextField label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            <TextField label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm({
                  ...form,
                  image: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                })
              }
            />
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
