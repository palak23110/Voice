# Voices  
*A Blogging Platform to Express Freely*

## Project Overview
**Voices** is a web based blogging platform where users can freely express their thoughts, ideas and experiences. The goal of this project is to create a simple and open digital space where people can write what's on their mind and share it with others.

This project focuses on combining **frontend design**, **backend development**, and **database integration** to build a functional content sharing platform.

Currently, the project is still under development and runs on a **local server**, with database support hosted on **MongoDB Atlas (Cloud)**.

---

## Features (Current & Planned)

### Completed
- User-friendly blogging interface
- Create and view blog posts
- Edit and delete blog posts
- User authentication (Login/Signup)
- User profile viewing
- Frontend structure and styling
- Backend server setup
- MongoDB cloud database connection

### In Progress
- Deployment to live server
- Comment system on posts
- Like/React feature
- Rich text editor for blogs
- Improved user dashboard

---

## Tech Stack

**Frontend:**
- HTML  
- CSS  
- JavaScript  

**Backend:**
- Node.js  
- Express.js  

**Database:**
- MongoDB Atlas (Cloud Database)

---

##  How to Run This Project Locally

Follow these steps to see the project output on your system:




### 1️. Clone the Repository
```bash
git clone https://github.com/YOUR-USERNAME/voices-blogging-platform.git
cd voices-blogging-platform
```

### 2. Install Dependencies
Make sure you have Node.js installed, then run:
```bash 
npm install
```

### 3. Setup Environment Variables
Create a .env file in the root folder and add:

MONGO_URI=your_mongodb_connection_string
PORT=5000

Replace your_mongodb_connection_string with your MongoDB Atlas cluster connection link.

### 4. Start the Server
```bash 
npm start
```
### 5. Open in Browser 
Once the server is running, open your browser and go to:

http://localhost:3000
