pipeline {
    agent any

    environment {
        APP_NAME = 'smart-expense-splitter'
        DOCKER_IMAGE = 'smart-expense-splitter'
        PORT = '3000'
        CONTAINER_NAME = 'smart-expense-splitter-jenkins'
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('1. Checkout Repository') {
            steps {
                echo '📥 Checking out source code from Git...'
                checkout scm
            }
        }

        stage('2. Install Dependencies') {
            steps {
                echo '📦 Installing Node.js application dependencies...'
                script {
                    if (isUnix()) {
                        sh 'npm install'
                    } else {
                        bat 'npm install'
                    }
                }
            }
        }

        stage('3. Run Jest Tests') {
            steps {
                echo '🧪 Executing Jest Supertest API Suite...'
                script {
                    if (isUnix()) {
                        sh 'npm test -- --ci --json --outputFile=test-results.json'
                    } else {
                        bat 'npm test -- --ci --json --outputFile=test-results.json'
                    }
                }
            }
        }

        stage('4. Build Docker Image') {
            steps {
                echo '🐳 Building production Docker container image...'
                script {
                    if (isUnix()) {
                        sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} -t ${DOCKER_IMAGE}:latest ."
                    } else {
                        bat "docker build -t ${DOCKER_IMAGE}:%BUILD_NUMBER% -t ${DOCKER_IMAGE}:latest ."
                    }
                }
            }
        }

        stage('5. Run Docker Container') {
            steps {
                echo '🚀 Starting transient Docker container for integration smoke test...'
                script {
                    if (isUnix()) {
                        sh "docker rm -f ${CONTAINER_NAME} || true"
                        sh "docker run -d --name ${CONTAINER_NAME} -p ${PORT}:3000 ${DOCKER_IMAGE}:latest"
                        sh "sleep 5"
                    } else {
                        bat "docker rm -f ${CONTAINER_NAME} 2>nul || exit 0"
                        bat "docker run -d --name ${CONTAINER_NAME} -p ${PORT}:3000 ${DOCKER_IMAGE}:latest"
                        bat "powershell -Command Start-Sleep -Seconds 5"
                    }
                }
            }
        }

        stage('6. Verify Health Endpoint') {
            steps {
                echo '🏥 Verifying GET /health endpoint response...'
                script {
                    if (isUnix()) {
                        sh "curl -f http://localhost:${PORT}/health || (docker logs ${CONTAINER_NAME} && exit 1)"
                    } else {
                        bat "curl -f http://localhost:%PORT%/health || powershell -Command Invoke-RestMethod -Uri http://localhost:%PORT%/health"
                    }
                }
            }
        }

        stage('7. Archive Test Results') {
            steps {
                echo '📁 Archiving test outputs and artifacts...'
                script {
                    // Cleanup testing container
                    if (isUnix()) {
                        sh "docker stop ${CONTAINER_NAME} || true"
                        sh "docker rm -f ${CONTAINER_NAME} || true"
                    } else {
                        bat "docker stop ${CONTAINER_NAME} 2>nul || exit 0"
                        bat "docker rm -f ${CONTAINER_NAME} 2>nul || exit 0"
                    }
                }
            }
        }
    }

    post {
        always {
            echo '🧹 Running cleanup tasks...'
            cleanWs deleteDirs: true, notFailBuild: true
        }
        success {
            echo "================================================================="
            echo "🎉 Jenkins CI/CD Pipeline SUCCEEDED for build #${env.BUILD_NUMBER}!"
            echo "🚀 Artifacts tested and ready for Render Cloud Deployment."
            echo "================================================================="
        }
        failure {
            echo "================================================================="
            echo "❌ Jenkins CI/CD Pipeline FAILED for build #${env.BUILD_NUMBER}."
            echo "Please inspect console logs above to diagnose the error."
            echo "================================================================="
        }
    }
}
