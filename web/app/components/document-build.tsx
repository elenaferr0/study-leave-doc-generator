import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { apiService, type ActivityType, type Language } from "../lib/api"

export function DocumentBuild() {
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [languages, setLanguages] = useState<Language[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false)

  // Create a dynamic schema that only validates conditionally after first submission
  const createFormSchema = (hasSubmitted: boolean) => {
    const baseSchema = z.object({
      activity_type: z.string().min(1, {
        message: "Please select an activity type.",
      }),
      language: z.string().min(1, {
        message: "Please select a language.",
      }),
      name: z.string().min(1, {
        message: "Student name is required.",
      }),
      id: z.string().min(1, {
        message: "Student ID is required.",
      }),
      degree: z.string().min(1, {
        message: "Degree program is required.",
      }),
      course: z.string().optional(),
      professor: z.string().optional(),
      date: z.string().min(1, {
        message: "Date is required.",
      }),
      city: z.string().min(1, {
        message: "City name is required.",
      }),
      image_path: z.string().optional(),
    });

    if (!hasSubmitted) {
      return baseSchema;
    }

    return baseSchema.superRefine((data, ctx) => {
      // Only validate activity-specific requirements after first submission
      if (data.activity_type === "lectures") {
        if (!data.course || data.course.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Course is required for lectures.",
            path: ["course"],
          });
        }
      }
      if (data.activity_type === "oral-exam" || data.activity_type === "written-exam") {
        if (!data.course || data.course.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Course is required for exams.",
            path: ["course"],
          });
        }
      }
      if (data.activity_type === "office-hours") {
        if (!data.professor || data.professor.trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Professor is required for office hours.",
            path: ["professor"],
          });
        }
      }
    });
  };

  const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
    resolver: zodResolver(createFormSchema(hasSubmittedOnce)),
    mode: "onSubmit",
    reValidateMode: hasSubmittedOnce ? "onChange" : "onSubmit",
    defaultValues: {
      activity_type: "",
      language: "",
      name: "",
      id: "",
      degree: "",
      course: "",
      professor: "",
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow's date
      city: "",
      image_path: "imgs/unitn.jpg",
    },
  })

  // Watch activity type to show/hide relevant fields
  const selectedActivityType = form.watch("activity_type")

  // Update form resolver when hasSubmittedOnce changes, but don't trigger on every change
  useEffect(() => {
    if (hasSubmittedOnce) {
      // Only update the resolver, don't trigger validation immediately
      const currentValues = form.getValues();
      form.reset(currentValues, { 
        keepErrors: hasSubmittedOnce,
        keepDirty: true,
        keepIsSubmitted: hasSubmittedOnce,
        keepTouched: hasSubmittedOnce,
        keepIsValid: false,
        keepSubmitCount: true
      });
    }
  }, [hasSubmittedOnce]) // Remove form from dependencies to prevent infinite loops

  // Load activity types and languages on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [activityTypesResponse, languagesResponse] = await Promise.all([
          apiService.getActivityTypes(),
          apiService.getSupportedLanguages(),
        ])
        setActivityTypes(activityTypesResponse.activity_types)
        setLanguages(languagesResponse)
      } catch (error) {
        console.error("Failed to load data:", error)
        // You might want to show a toast or error message here
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  async function onSubmit(data: z.infer<ReturnType<typeof createFormSchema>>) {
    // Prevent multiple submissions
    if (isGenerating) {
      return;
    }

    // Mark that the form has been submitted at least once
    if (!hasSubmittedOnce) {
      setHasSubmittedOnce(true)
      // If this is the first submission, re-validate with the new schema
      const isValid = await form.trigger()
      if (!isValid) {
        return // Stop if validation fails
      }
    }
    
    setIsGenerating(true)
    try {
      const documentInputs = {
        language: data.language,
        name: data.name,
        id: data.id,
        degree: data.degree,
        course: data.course || "",
        professor: data.professor || "",
        date: data.date,
        city: data.city,
        image_path: data.image_path || "imgs/unitn.jpg",
        activity_type: data.activity_type,
      }

      const pdfBlob = await apiService.buildDocument(documentInputs)
      
      // Create a download link for the PDF
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'study-leave-document.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      // You might want to show a success message here
      console.log("Document generated successfully!")
    } catch (error) {
      console.error("Failed to generate document:", error)
      // You might want to show an error toast here
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return <div className="text-center">Loading form data...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        {/* Basic fields that are always required */}
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document language</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.code} value={language.code}>
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the language for your document.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormDescription>
                Your full name as it appears on official documents.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter your student ID" {...field} />
              </FormControl>
              <FormDescription>
                Your official student identification number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="degree"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Degree Program</FormLabel>
              <FormControl>
                <Input placeholder="Enter your degree program" {...field} />
              </FormControl>
              <FormDescription>
                The name of your degree program (e.g., Computer Science).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                The date of your study leave activity.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="Enter city name" {...field} />
              </FormControl>
              <FormDescription>
                The city where the activity will take place.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Activity Type - Now shown after basic info */}
        <FormField
          control={form.control}
          name="activity_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an activity type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activityTypes.map((activity) => (
                    <SelectItem key={activity.value} value={activity.value}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose the type of activity for your study leave.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Show activity-specific fields only after activity type is selected */}
        {selectedActivityType && (
          <>
            {/* Show course field for lectures and exams */}
            {(selectedActivityType === "lectures" || 
              selectedActivityType === "oral-exam" || 
              selectedActivityType === "written-exam") && (
              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter course name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Required for {selectedActivityType === "lectures" ? "lectures" : "exams"}.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Show professor field for office hours */}
            {selectedActivityType === "office-hours" && (
              <FormField
                control={form.control}
                name="professor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professor Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter professor name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Required for office hours.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <Button type="submit" disabled={isGenerating}>
          {isGenerating ? "Generating Document..." : "Generate Document"}
        </Button>
      </form>
    </Form>
  )
}
