package com.example.studentclient.api

import com.example.studentclient.model.Student
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface StudentApi {
    @GET("students")
    fun getStudents(): Call<List<Student>>

    @POST("students")
    fun addStudent(@Body student: Student): Call<Student>
}
