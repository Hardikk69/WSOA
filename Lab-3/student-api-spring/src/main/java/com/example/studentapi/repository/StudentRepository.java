package com.example.studentapi.repository;

import com.example.studentapi.model.Student;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class StudentRepository {

    private final List<Student> students = new ArrayList<>();
    private long nextId = 1;

    public StudentRepository() {
        // Initial data
        students.add(new Student(nextId++, "Alice Smith", "alice@example.com", "Computer Science", 3));
        students.add(new Student(nextId++, "Bob Johnson", "bob@example.com", "Information Technology", 2));
    }

    public List<Student> findAll() {
        return students;
    }

    public Optional<Student> findById(Long id) {
        return students.stream().filter(s -> s.getId().equals(id)).findFirst();
    }

    public Student save(Student student) {
        if (student.getId() == null) {
            student.setId(nextId++);
            students.add(student);
        } else {
            // update existing
            int index = -1;
            for (int i = 0; i < students.size(); i++) {
                if (students.get(i).getId().equals(student.getId())) {
                    index = i;
                    break;
                }
            }
            if (index != -1) {
                students.set(index, student);
            }
        }
        return student;
    }
}
