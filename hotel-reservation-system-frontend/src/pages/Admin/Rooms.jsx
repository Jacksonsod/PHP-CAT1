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

export default function Rooms() {
  const [rows, setRows] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ hotel: '', number: '', type: 'Standard', price: 0, status: 'available' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selected, setSelected] = React.useState([]);

  const endpoint = 'http://localhost/PHP-CAT1/hotel-reservation-system-frontend/src/backend/controllers/RoomsController.php';

  const toast = useToast();

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
        if (res.data?.success) {
          setRows(rows.filter(r => r.id !== id));
          setSelected(prev => prev.filter(x => x !== id));
          toast.success('Room deleted');
        } else {
          setError(res.data?.message || 'Delete failed');
          toast.error(res.data?.message || 'Delete failed');
        }
      })
      .catch(err => {
        console.error('Delete room error:', err?.response?.status, err?.response?.data || err);
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
        toast.success('Selected rooms deleted');
      })
      .catch(err => {
        console.error('Bulk delete rooms error:', err?.response?.status, err?.response?.data || err);
        toast.error('Failed to delete some rooms');
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
            toast.success('Room updated');
          } else {
            const id = res.data.id;
            setRows([{ id, ...form }, ...rows]);
            toast.success('Room created');
          }
          setOpen(false);
          setEditing(null);
          setForm({ hotel: '', number: '', type: 'Standard', price: 0, status: 'available' });
        } else {
          setError(res.data?.message || 'Save failed');
          toast.error(res.data?.message || 'Save failed');
        }
      })
      .catch(err => {
        console.error('Save room error:', err?.response?.status, err?.response?.data || err);
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
      String(row.hotel || '').toLowerCase().includes(term) ||
      String(row.number || '').toLowerCase().includes(term) ||
      String(row.type || '').toLowerCase().includes(term);
    const matchesStatus = !statusFilter || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
          <Toolbar sx={{ justifyContent: 'space-between', px: 0, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                label="Search by hotel / number / type / ID"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
              <Select
                size="small"
                value={statusFilter}
                displayEmpty
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="available">available</MenuItem>
                <MenuItem value="occupied">occupied</MenuItem>
                <MenuItem value="dirty">dirty</MenuItem>
                <MenuItem value="maintenance">maintenance</MenuItem>
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
                  inputProps={{ 'aria-label': 'select all rooms' }}
                />
              </TableCell>
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
