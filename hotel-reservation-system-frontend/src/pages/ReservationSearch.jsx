import React, { useState } from 'react';
import {
    Box, Grid, Typography, TextField, Select, MenuItem,
    Button, Card, CardMedia, CardContent, CardActions,
    Dialog, DialogTitle, DialogContent, DialogActions, Container
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Footer from '../components/Footer.jsx';

const ReservationSearch = () => {
    const [location, setLocation] = useState('');
    const [roomType, setRoomType] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [checkIn, setCheckIn] = useState(null);
    const [checkOut, setCheckOut] = useState(null);

    const rooms = [
        { id: 1, hotel: 'Karongi View Hotel', type: 'Deluxe', price: 80, image: '/images/room1.jpg', amenities: ['WiFi', 'AC'] },
        { id: 2, hotel: 'Lake Kivu Resort', type: 'Standard', price: 50, image: '/images/room2.jpg', amenities: ['TV', 'Breakfast'] },
    ];

    const handleBook = (room) => setSelectedRoom(room);
    const handleConfirmBooking = () => {
        console.log('Booking confirmed:', selectedRoom, checkIn, checkOut);
        setSelectedRoom(null);
        setCheckIn(null);
        setCheckOut(null);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container maxWidth="md">
                <Box py={4}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Search & Book Rooms
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Location" fullWidth value={location} onChange={e => setLocation(e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Select fullWidth value={roomType} onChange={e => setRoomType(e.target.value)} displayEmpty>
                                <MenuItem value="">Room Type</MenuItem>
                                <MenuItem value="Standard">Standard</MenuItem>
                                <MenuItem value="Deluxe">Deluxe</MenuItem>
                                <MenuItem value="Suite">Suite</MenuItem>
                            </Select>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <Select fullWidth value={priceRange} onChange={e => setPriceRange(e.target.value)} displayEmpty>
                                <MenuItem value="">Price Range</MenuItem>
                                <MenuItem value="0-50">$0 - $50</MenuItem>
                                <MenuItem value="51-100">$51 - $100</MenuItem>
                                <MenuItem value="101-200">$101 - $200</MenuItem>
                            </Select>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3} mt={3}>
                        {rooms.map(room => (
                            <Grid item xs={12} sm={6} md={4} key={room.id}>
                                <Card>
                                    <CardMedia component="img" height="140" image={room.image} alt={room.type} />
                                    <CardContent>
                                        <Typography variant="h6">{room.hotel}</Typography>
                                        <Typography variant="body2">{room.type} - ${room.price}/night</Typography>
                                        <Typography variant="caption">Amenities: {room.amenities.join(', ')}</Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button size="small" onClick={() => handleBook(room)}>Book Now</Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    <Dialog open={!!selectedRoom} onClose={() => setSelectedRoom(null)}>
                        <DialogTitle>Book Room</DialogTitle>
                        <DialogContent>
                            <Typography gutterBottom>{selectedRoom?.hotel} - {selectedRoom?.type}</Typography>
                            <Box mt={2}>
                                <DatePicker
                                    label="Check-In"
                                    value={checkIn}
                                    onChange={setCheckIn}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </Box>
                            <Box mt={2}>
                                <DatePicker
                                    label="Check-Out"
                                    value={checkOut}
                                    onChange={setCheckOut}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setSelectedRoom(null)}>Cancel</Button>
                            <Button onClick={handleConfirmBooking} disabled={!checkIn || !checkOut}>Confirm</Button>
                        </DialogActions>
                    </Dialog>
                </Box>
                <Footer />
            </Container>
        </LocalizationProvider>
    );
};

export default ReservationSearch;
