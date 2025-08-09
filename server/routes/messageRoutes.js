import { getChatMessages, sendMessage } from '../controllers/messageController';
import {protect} from '../middlewares/auth.js';

const messageRouter = express.Router();

messageRouter.get ('/:userId', sseController)
messageRouter.post ('/send', upload.single('image'), protect, sendMessage )
messageRouter.post('/get', protect, getChatMessages)

export default messageRouter