package com.example.studentclient

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.studentclient.api.RetrofitClient
import com.example.studentclient.model.Student
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import org.json.JSONObject

class AddStudentActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_add_student)

        val editName: EditText = findViewById(R.id.editName)
        val editEmail: EditText = findViewById(R.id.editEmail)
        val editCourse: EditText = findViewById(R.id.editCourse)
        val editSemester: EditText = findViewById(R.id.editSemester)
        val btnSave: Button = findViewById(R.id.btnSave)

        btnSave.setOnClickListener {
            val name = editName.text.toString()
            val email = editEmail.text.toString()
            val course = editCourse.text.toString()
            val semester = editSemester.text.toString().toIntOrNull() ?: 0

            val student = Student(name = name, email = email, course = course, semester = semester)

            RetrofitClient.instance.addStudent(student).enqueue(object : Callback<Student> {
                override fun onResponse(call: Call<Student>, response: Response<Student>) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@AddStudentActivity, "Student added successfully", Toast.LENGTH_SHORT).show()
                        finish()
                    } else if (response.code() == 400) {
                        try {
                            val errorBody = response.errorBody()?.string()
                            val jsonObject = JSONObject(errorBody!!)
                            val errorMessage = jsonObject.getString("error")
                            Toast.makeText(this@AddStudentActivity, errorMessage, Toast.LENGTH_LONG).show()
                        } catch (e: Exception) {
                            Toast.makeText(this@AddStudentActivity, "Validation Error", Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        Toast.makeText(this@AddStudentActivity, "Failed to add student", Toast.LENGTH_SHORT).show()
                    }
                }

                override fun onFailure(call: Call<Student>, t: Throwable) {
                    Toast.makeText(this@AddStudentActivity, "Something went wrong", Toast.LENGTH_SHORT).show()
                }
            })
        }
    }
}
