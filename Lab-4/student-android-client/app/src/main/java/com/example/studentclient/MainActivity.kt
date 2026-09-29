package com.example.studentclient

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.studentclient.api.RetrofitClient
import com.example.studentclient.model.Student
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnAdd: Button = findViewById(R.id.btnAdd)
        btnAdd.setOnClickListener {
            startActivity(Intent(this, AddStudentActivity::class.java))
        }

        fetchStudents()
    }

    override fun onResume() {
        super.onResume()
        fetchStudents()
    }

    private fun fetchStudents() {
        RetrofitClient.instance.getStudents().enqueue(object : Callback<List<Student>> {
            override fun onResponse(call: Call<List<Student>>, response: Response<List<Student>>) {
                if (response.isSuccessful) {
                    val students = response.body()
                    // Normally you would update a RecyclerView here
                    Toast.makeText(this@MainActivity, "Loaded ${students?.size} students", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@MainActivity, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<List<Student>>, t: Throwable) {
                Toast.makeText(this@MainActivity, "Something went wrong", Toast.LENGTH_SHORT).show()
            }
        })
    }
}
