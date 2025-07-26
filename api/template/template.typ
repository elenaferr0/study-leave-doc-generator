#import "@preview/transl:0.1.0": fluent, transl
#transl(data: eval(fluent("ftl/", lang: ("en", "it"))))
#import "@preview/cheq:0.2.2": checklist

#show: checklist

#let inputs = json(bytes(sys.inputs.inputs))
// #let inputs = (
//   language: "it",
//   name: "Elena Rossi",
//   id: "12345678",
//   city: "Trento",
//   degree: "Computer Science",
//   course: "Advanced Programming",
//   professor: "Mario Bianchi",
//   date: "2024-01-01",
//   activity: "lectures",
//   image_path: "imgs/unitn.jpg",
// )

// Inputs
#let language = inputs.language
#let name = inputs.name
#let id = inputs.id
#let degree = inputs.degree
#let course = inputs.course
#let professor = inputs.professor
#let date_str = inputs.date
#let city = inputs.city
#let image-path = inputs.image_path
#let activity = inputs.activity_type

#assert(
  name != none and name.len() > 0,
  message: "Name must be provided.",
)

#assert(
  id != none and id.len() > 0,
  message: "ID must be provided.",
)

#assert(
  degree != none and degree.len() > 0,
  message: "Degree must be provided.",
)

#assert(
  date_str.match(regex("^\d{4}-\d{2}-\d{2}$")).len() > 0,
  message: "Date must be in the format YYYY-MM-DD.",
)

#assert(
  city != none and city.len() > 0,
  message: "City must be provided.",
)

#assert(
  image-path != none and image-path.len() > 0,
  message: "Image path must be provided.",
)

#assert(
  language != none and language.len() > 0,
  message: "Language must be provided.",
)

#let activities = ("lectures", "oral-exam", "written-exam", "office-hours")
#assert(
  activity in activities,
  message: "Activity must be one of: " + activities.join(", "),
)

// https://github.com/typst/typst/issues/4107#issuecomment-2104109803
#let date = toml(bytes("date = " + date_str)).date

#assert(
  if activity == "lectures" { 1 } else { 0 }
    + if activity == "oral-exam" { 1 } else { 0 }
    + if activity == "written-exam" { 1 } else { 0 }
    + if activity == "office-hours" { 1 } else { 0 }
    <= 1,
  message: "At most one of lectures, oral-exam, written-exam, office-hours can be true.",
)

// Styling and layout

#show: checklist.with(stroke: rgb("CE0F2D"), fill: white, radius: .2em)
#set text(lang: language, 12pt)
#show smallcaps: it => align(center, text(it, size: 14pt))

// Helper functions

#let date-with-city = (city: str, when: datetime) => { city + ", " + when.display("[day]/[month]/[year]") }

#let field = txt => {
  if txt.len() == 0 {
    return "_" * 35
  }
  box(
    align(center, pad(txt, bottom: 3pt)),
    stroke: (bottom: 0.5pt),
    width: 10pt * txt.len(),
  )
}

#let value-or-blank = value => {
  if value == none or value.len() == 0 {
    return "_" * 20
  }
  return value
}

// Main document structure

#grid(
  rows: 1,
  columns: (2fr, 1fr, 1fr),
  align: start + horizon,
  text(transl("disi")), align(end, line(angle: 90deg, length: 50pt)), image(image-path),
)


#align(horizon, [
  #align(right, date-with-city(when: date, city: city))
  #v(40pt)

  #smallcaps(transl("declaration"))

  #transl("student-data", args: (name: name, id: id, degree: degree))

  #v(20pt)

  #if activity == "lectures" {
    // Ugly but there's probably no better way to do this
    [
      - [x] *#transl("lectures")*\
      #transl("lecture-description", args: (course: value-or-blank(course)))
    ]
  } else {
    [
      - [  ] *#transl("lectures")*\
      #transl("lecture-description", args: (course: value-or-blank(course)))
    ]
  }

  #v(15pt)

  #if activity == "written-exam" {
    [
      - [x] *#transl("exams")*\
      #transl("exams-description")
      #v(5pt)
      #set list(indent: 15pt)
      - [x] #transl("written-exam")
      - [  ] #transl("oral-exam")
      #set list(indent: 0pt)
    ]
  } else if activity == "oral-exam" {
    [
      - [x] *#transl("exams")*\
      #transl("exams-description")
      #v(5pt)
      #set list(indent: 15pt)
      - [  ] #transl("written-exam")
      - [x] #transl("oral-exam")
      #set list(indent: 0pt)
    ]
  } else {
    [
      - [  ] *#transl("exams")*\
      #transl("exams-description")
      #v(5pt)
      #set list(indent: 15pt)
      - [  ] #transl("written-exam")
      - [  ] #transl("oral-exam")
      #set list(indent: 0pt)
    ]
  }


  #transl("for-the-course", args: (course: course))
  #v(15pt)


  #if activity == "office-hours" {
    [
      - [x] *#transl("office-hours")*\
      #transl("office-hours-description", args: (professor: value-or-blank(professor)))
    ]
  } else {
    [
      - [  ] *#transl("office-hours")*\
      #transl("office-hours-description", args: (professor: value-or-blank(professor)))
    ]
  }

  #v(20pt)

  #align(end, grid(
    columns: 1,
    gutter: 25pt,
    align: right,
    [#transl("appointed-professor")\ #transl("signature-description")],
    field(""),
  ))])
