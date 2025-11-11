import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';


export default function Landing() {
  const navigate = useNavigate();

  return (
    <>
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#f0f4f8"
      textAlign="center"
      px={2}
    >
      <Typography variant="h3" gutterBottom>
        Welcome to Hotel Reservation System
      </Typography>
      <Typography variant="h6" color="text.secondary" mb={4}>
        Book rooms, manage reservations, and enjoy your stay.
      </Typography>
      <Stack direction="row" spacing={3}>
       <Button variant="contained" onClick={() => navigate('/login')}>
  Login
</Button>
<Button variant="outlined" onClick={() => navigate('/signup')}>
  Signup
</Button>
      </Stack>
    </Box>
    <Footer />
    </>
  );
}