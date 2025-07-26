import json, typst
import os

def main():
    inputs = {
        "language": "it",
        "name": "Elena Ferro",
        "id": "123456",
        "degree": "Computer Science",
        "course": "Advanced Programming",
        "professor": "Prof. Rossi",
        "date": "2023-10-01",
        "city": "Rome",
        "image_path": os.path.join("imgs", "unitn.jpg"),
        "lectures": True,
        "oral_exam": False,
        "written_exam": False,
        "office_hours": False
    }

    typst.compile(input="template/document.typ", output="document.pdf", sys_inputs={"inputs": json.dumps(inputs)})
    

if __name__ == "__main__":
    main()
