import React, { useEffect, useState } from 'react';
import { CardActionArea } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Checkbox from '@mui/material/Checkbox';
import MapboxComponent from './MapBoxComponent';

export default function MyCard({ animationurl, boundary, holes, name, description}) {

    const [isChecked, setIsChecked] = React.useState(false);
    const [showModal, setShowModal] = useState(false);
    const [token, setToken] = useState([]);

    const handleButtonClick = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
    setShowModal(false);
    };

    const handleCheckboxChange = (e) => {
        if (isChecked) {
            console.log("unchecking")
        } else {
            console.log("checking")
        }
        setIsChecked(e.target.checked);
    }

      return (
        <>
            <Card sx={{ maxWidth: 345, margin: 5}}>
                <CardActionArea>
                    <CardMedia
                        component="iframe"
                        src={animationurl}
                        width="100%"
                        height="400"
                        title="Embedded Content"
                        allow="FullScreen"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    />
                    <CardContent>
                        <Typography gutterBottom variant="h5" component="div">
                            {name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {description}
                        </Typography>
                        <Button variant="contained" color="primary" onClick={handleButtonClick}>
                            Split
                        </Button>
                        <Checkbox
                            checked={isChecked}
                            onChange={handleCheckboxChange}
                        />
                    </CardContent>
                </CardActionArea>
            </Card>

            <Modal open={showModal} onClose={handleModalClose}>
            <Box sx={{ outline: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <MapboxComponent
                showModal={showModal}
                onCloseModal={handleModalClose}
                boundary={boundary}
                holes={holes}
            />
            </Box>
            </Modal>
        </>
    );
}