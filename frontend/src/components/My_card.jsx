import React, { useEffect, useState } from 'react';
import { CardActionArea } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';

export default function MyCard({ animationurl, name, description}) {

    const [isChecked, setIsChecked] = React.useState(false);

    const handleButtonClick = () => {
        console.log("button click")
    }

    const handleCheckboxChange = (e) => {
        if (isChecked) {
            console.log("unchecking")
        } else {
            console.log("checking")
        }
        setIsChecked(e.target.checked);
    }

    return (
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
    );
}