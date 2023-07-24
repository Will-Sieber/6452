import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';

export default function ActionAreaCard() {
    const [iframeURL, setIframeURL] = useState('');

    useEffect(() => {
        fetch({ animationurl })
        .then((response) => response.json())
        .then((data) => {
            const fetchedIframeURL = data.iframe;
            setIframeURL(fetchedIframeURL); 
        })
        .catch((error) => {
            console.error('Error fetching iframe:', error);
        });
    }, []);
}

export default function ActionAreaCard() {
    return (
        <Card sx={{ maxWidth: 345 }}>
            <CardActionArea>
                <CardMedia
                    src={iframeURL}
                    width="100%"
                    height="400"
                    title="Embedded Content"
                    frameBorder="0"
                    allowFullScreen
                />
                <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                        {{ name }}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {{ description }}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}