import { Inngest } from "inngest";
import User from "../models/User.js";
import connectDB from "../config/db.js";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "knowledgehive-app",
  webhookSigningSecret: process.env.INNGEST_SIGNING_KEY
});

// Ingest function to save user data to a database
const syncUserCreation = inngest.createFunction(
  { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    try {
      console.log('syncUserCreation triggered with event:', event);
      await connectDB();

      const { id, first_name, last_name, email_addresses, image_url } = event.data;

      if (!email_addresses || email_addresses.length === 0) {
        throw new Error('No email addresses found in event data');
      }

      const email = email_addresses[0].email_address;
      let username = email.split('@')[0];

      const user = await User.findOne({ username });
      if (user) {
        username = username + Math.floor(Math.random() * 10000);
      }

      const userData = {
        _id: id,
        email,
        full_name: `${first_name} ${last_name}`,
        profile_picture: image_url,
        username,
      };

      await User.create(userData);
      console.log('✅ User saved to DB:', userData);
    } catch (error) {
      console.error('❌ Error in syncUserCreation:', error);
      throw error;
    }
  }
);




// Image function to update user data in database
const syncUserUpdation = inngest.createFunction(
    {id: 'update-user-from-clerk'},
    {event: 'clerk/user.updated'},
    async({event}) => {
        const {id,first_name,last_name,email_address,image_url} = event.data

        const updateUserData = {
            email: email_address[0].email_address,
            full_name: first_name+ " " + last_name,
            profile_picture: image_url
        }
      await User.findByIdAndUpdate(id , updateUserData)

       
        
    }
)

// Image function to delete user data from database
const syncUserDeletion = inngest.createFunction(
    {id: 'delete-user-from-clerk'},
    {event: 'clerk/user.deleted'},
    async({event}) => {
        const {id} = event.data
        await User.findByIdAndDelete(id)
    }
)

// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion
];

