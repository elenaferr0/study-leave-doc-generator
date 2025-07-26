# Study Leave Document Generator

A web application that generates study leave documents for working students. For the time being, this is generated with UniTrento's header, but might become parametric if needed.

## Context

In Italy, steelworker contracts offer paid study leave to employees which are enrolled in a degree program. To receive this benefit, workers must provide a document signed by the appointed professor specifying the type of academic activity they need to attend (most commonly, exams).

This application automates the generation of a pre-filled document by providing a simple web interface where users can input their details. Information that'll likely never change is cached in the user's browser (and it never leaves it).

## Features

- As of now, the application supports the following academic activities:
    - Lectures
    - Oral exams
    - Written exams
    - Office hours meetings
- The document can be generated in both Italian and English
- The document is generated in PDF format using the Typst templating system. This works by injecting parameters into a template

## Screenshots

### Web Interface
![Web Interface](imgs/webpage.png)

### Generated Document
![Generated Document](imgs/document.png)

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: React with Vite
- **PDF Generation**: Typst templating system  
- **Validation**: Pydantic models
- **Styling**: Modern UI components

## API Endpoints

- `GET /document/activity-types` - Get available activity types
- `GET /document/supported-languages` - Get supported languages  
- `POST /document/build` - Generate PDF document

The application ensures that the right fields are required based on the selected activity type (e.g., course name for exams, professor name for office hours).
