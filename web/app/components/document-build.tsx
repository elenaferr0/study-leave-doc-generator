import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { apiService, type ActivityType, type Language } from "../lib/api"
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

// Cookie utilities - only work in browser environment
const setCookie = (name: string, value: string, days: number = 30) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return; // Skip cookie operations in non-browser environments
  }
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null; // Return null in non-browser environments
  }
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Load saved user data from cookies
const loadSavedUserData = () => {
  if (typeof window === 'undefined') {
    // Return empty defaults in non-browser environments
    return {
      name: '',
      id: '',
      degree: '',
      city: '',
      language: '',
    };
  }
  return {
    name: getCookie('student_name') || '',
    id: getCookie('student_id') || '',
    degree: getCookie('student_degree') || '',
    city: getCookie('student_city') || '',
    language: getCookie('student_language') || '',
  };
};

// Save user data to cookies
const saveUserDataToCookies = (name: string, id: string, degree: string, city: string, language: string) => {
  setCookie('student_name', name);
  setCookie('student_id', id);
  setCookie('student_degree', degree);
  setCookie('student_city', city);
  setCookie('student_language', language);
};

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
      if (data.activity_type === "office-hours-meeting") {
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

        // Load saved user data from cookies after languages are loaded
        const savedUserData = loadSavedUserData();
        if (savedUserData.name || savedUserData.id || savedUserData.degree || savedUserData.city || savedUserData.language) {
          // Update form with saved data
          form.reset({
            activity_type: "",
            language: savedUserData.language,
            name: savedUserData.name,
            id: savedUserData.id,
            degree: savedUserData.degree,
            course: "",
            professor: "",
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            city: savedUserData.city,
            image_path: "imgs/unitn.jpg",
          });
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        // You might want to show a toast or error message here
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Remove the separate useEffect for loading saved data since it's now in the data loading useEffect

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
      // Save user data to cookies for future use
      saveUserDataToCookies(data.name, data.id, data.degree, data.city, data.language);

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

      // Create a download link for the PDF - only in browser environment
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'study-leave-document.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }

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
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <SelectValue placeholder="Select a language" />
                    </div>
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
                The city to use in the document header.
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
            {selectedActivityType === "office-hours-meeting" && (
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
                      Required for office hours meeting.
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
