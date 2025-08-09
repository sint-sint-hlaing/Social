import express from 'express'
import { upload } from '../config/multer';
import { protect } from '../middlewares/auth';
import { addUserStory, getStories } from '../controllers/storyController';

const storyRouter = express.Router();

storyRouter.post('/create' , upload.single('media') , protect , addUserStory)
storyRouter.get('/get' ,  protect , getStories)

export default storyRouter