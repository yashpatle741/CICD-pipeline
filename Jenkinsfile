pipeline {

    agent any

    stages {

        stage('Stop Old Container') {
            steps {
                sh 'docker-compose down || true'
            }
        }

        stage('Deploy Application') {
            steps {
                sh 'docker-compose up --build -d'
            }
        }
    }
}
