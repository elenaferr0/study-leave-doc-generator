"""Document input models for validation."""

import datetime
from pathlib import Path
from enum import Enum
from langcodes import Language
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict, ValidationError
from pydantic_core import PydanticCustomError
from typing import Self


class ActivityType(str, Enum):
    LECTURES = "lectures"
    ORAL_EXAM = "oral-exam"
    WRITTEN_EXAM = "written-exam"
    OFFICE_HOURS = "office-hours"


class DocumentInputs(BaseModel):
    model_config = ConfigDict(
        validate_assignment=True,
        json_encoders={
            datetime.date: lambda v: v.isoformat(),
            str: lambda v: "" if v is None else v # typst requires strings
        },
        json_schema_extra={
            "example": {
                "language": "it",
                "name": "John Smith",
                "id": "123456",
                "degree": "Computer Science",
                "course": "Advanced Programming",  
                "professor": "Tim Berners-Lee",
                "date": "2023-10-01",
                "city": "Trento",
                "image_path": "imgs/unitn.jpg",
                "activity_type": "lectures"
            }
        }
    )
    
    language: str = Field(..., description="Language code ('en' or 'it')")
    name: str = Field(..., min_length=1, description="Student name")
    id: str = Field(..., min_length=1, description="Student ID")
    degree: str = Field(..., min_length=1, description="Degree program")
    course: str = Field(default=None, description="Course name")
    professor: str = Field(default=None, description="Professor name")
    date: datetime.date = Field(default=datetime.date.today() + datetime.timedelta(days=1), description="Date in YYYY-MM-DD format. Defaults to tomorrow")
    city: str = Field(..., min_length=1, description="City name")
    image_path: str = Field(default="imgs/unitn.jpg", description="Path to institution image")
    activity_type: ActivityType = Field(..., description="Type of academic activity")

    @field_validator('language')
    @classmethod
    def validate_language(cls, v):
        try:
            Language.make(language=v)
            return v
        except:
            raise PydanticCustomError(
                'invalid_language',
                'Invalid language code: {language}',
                {'language': v}
            )

    @field_validator('image_path')
    @classmethod
    def validate_image_path(cls, v):
        # Convert to Path for validation
        path = Path(v)
        return str(path)

    @model_validator(mode='after')
    def validate_activity_requirements(self) -> Self:
        """Validate required fields based on the selected activity type"""
        
        if self.activity_type == ActivityType.LECTURES:
            if not self.course or self.course.strip() == "":
                raise PydanticCustomError(
                    'course_required_for_lectures',
                    'Course must be provided when lectures is selected',
                    {}
                )
            
        elif self.activity_type in [ActivityType.ORAL_EXAM, ActivityType.WRITTEN_EXAM]:
            # For exams: course is required, professor is not needed
            if not self.course or self.course.strip() == "":
                raise PydanticCustomError(
                    'course_required_for_exam',
                    'Course must be provided when exam is selected',
                    {}
                )
            
        elif self.activity_type == ActivityType.OFFICE_HOURS:
            # For office hours: professor is required, course can be empty
            if not self.professor or self.professor.strip() == "":
                raise PydanticCustomError(
                    'professor_required_for_office_hours',
                    'Professor must be provided when office_hours is selected',
                    {}
                )
        
        return self
    
    # Helper properties for backward compatibility with the template
    @property
    def lectures(self) -> bool:
        """Returns True if activity_type is lectures"""
        return self.activity_type == ActivityType.LECTURES
    
    @property 
    def oral_exam(self) -> bool:
        """Returns True if activity_type is oral_exam"""
        return self.activity_type == ActivityType.ORAL_EXAM
    
    @property
    def written_exam(self) -> bool:
        """Returns True if activity_type is written_exam"""
        return self.activity_type == ActivityType.WRITTEN_EXAM
    
    @property
    def office_hours(self) -> bool:
        """Returns True if activity_type is office_hours"""
        return self.activity_type == ActivityType.OFFICE_HOURS
