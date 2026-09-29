package com.example.studentclient.model

data class Student(
    val id: Int? = null,
    val name: String,
    val email: String,
    val course: String,
    val semester: Int
)
