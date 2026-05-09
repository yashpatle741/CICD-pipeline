pipeline {

    agent any

    stages {

        stage('Stop Old Containers') {
            steps {
                sh 'docker compose down || true'
            }
        }

        stage('Deploy Application') {
            steps {
                sh 'docker compose up --build -d'
            }
        }
    }
}
