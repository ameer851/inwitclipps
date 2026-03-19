# InwitClipps Backend Test Suite

Comprehensive test suite for the InwitClipps backend API and workers using Jest and Supertest.

## 📦 Test Coverage

### API Integration Tests

#### 1. **Authentication Tests** (`tests/api/auth.test.js`)
- ✅ Mock Supabase auth registration and login
- ✅ JWT token validation
- ✅ Auth middleware protection
- ✅ Bearer token format validation
- ✅ Unauthorized access rejection

#### 2. **Jobs API Tests** (`tests/api/jobs.test.js`)
- ✅ `POST /api/v1/jobs` - Create job with valid URL
- ✅ `POST /api/v1/jobs` - Reject invalid URLs
- ✅ `POST /api/v1/jobs` - Reject missing authentication
- ✅ `GET /api/v1/jobs` - List user's jobs
- ✅ `GET /api/v1/jobs/:id` - Get job details (owner only)
- ✅ `GET /api/v1/jobs/:id` - Return 403 for non-owner access
- ✅ `GET /api/v1/jobs/:id/status` - Return status field only
- ✅ Job creation enqueues download worker

### Worker Unit Tests

#### 3. **Download Worker Tests** (`tests/workers/download.worker.test.js`)
- ✅ Mock yt-dlp spawn for video download
- ✅ Mock ffprobe for duration extraction
- ✅ Mock S3/Supabase Storage upload
- ✅ Verify status transitions: `queued` → `downloading` → `transcribing`
- ✅ Test error handling and cleanup
- ✅ Test temporary file cleanup on success/failure
- ✅ Test invalid URL handling
- ✅ Test storage upload failures

#### 4. **Transcription Worker Tests** (`tests/workers/transcription.worker.test.js`)
- ✅ Mock ffmpeg audio extraction
- ✅ Mock OpenAI Whisper API transcription
- ✅ Verify status transitions: `transcribing` → `analyzing`
- ✅ Test word-level timestamp storage
- ✅ Test transcript JSON storage in database
- ✅ Test cleanup of temporary files
- ✅ Test error handling (ffmpeg, Whisper API)
- ✅ Test large transcript handling
- ✅ Test non-English transcription

## 🛠️ Test Utilities

### Mock Helpers (`tests/helpers/`)

- **mockSupabase.js** - Mock Supabase client for auth and storage
- **mockBullMQ.js** - In-memory queue simulation without Redis
- **mockDb.js** - Mock Drizzle ORM database client
- **mockChildProcess.js** - Mock `child_process.spawn` for yt-dlp
- **mockFfmpeg.js** - Mock fluent-ffmpeg for video processing
- **mockOpenAI.js** - Mock OpenAI SDK for Whisper transcription
- **mockStorage.js** - Mock S3/Supabase Storage operations

## 🚀 Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- tests/api/jobs.test.js
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="should create a job"
```

## 📊 Coverage Goals

The test suite aims for:
- **Lines**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Statements**: > 80%

Coverage reports are generated in `coverage/` directory:
- `coverage/lcov-report/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI/CD tools

## 🔧 Configuration

### Jest Configuration (`jest.config.js`)
- Uses Node test environment
- ES modules support via `extensionsToTreatAsEsm`
- Global setup in `tests/setup.js`
- 10-second test timeout
- Auto-mock clearing between tests

### Environment Variables (`tests/setup.js`)
All required environment variables are mocked for testing:
```javascript
SUPABASE_URL=https://test.supabase.co
SUPABASE_ANON_KEY=test-anon-key
OPENAI_API_KEY=test-openai-key
UPSTASH_REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://test:test@localhost:5432/test
STORAGE_RAW_BUCKET=test-raw-bucket
TMP_DIR=/tmp/inwitclipps-test
LOG_LEVEL=silent
```

## 🧪 Test Patterns

### API Integration Tests
```javascript
describe('POST /api/v1/jobs', () => {
  it('should create a job with valid URL', async () => {
    const response = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', 'Bearer valid-token')
      .send({ source_url: 'https://youtube.com/watch?v=test' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      status: 'queued',
    });
  });
});
```

### Worker Unit Tests
```javascript
it('should update status to downloading', async () => {
  const job = { data: { jobId: 'test-id', sourceUrl: 'https://...' } };
  
  await downloadWorkerProcessor(job);
  
  expect(jobStatusHistory[0].status).toBe('downloading');
});
```

## 📝 Adding New Tests

1. Create test file in appropriate directory:
   - `tests/api/` for API integration tests
   - `tests/workers/` for worker unit tests
   - `tests/services/` for service tests

2. Import required mocks from `tests/helpers/`

3. Use `describe` blocks to group related tests

4. Use `beforeEach` to reset mocks between tests

5. Write descriptive test names: "should [expected behavior] when [condition]"

## 🐛 Debugging Tests

### Enable Console Output
Comment out the console mock in `tests/setup.js`:
```javascript
// global.console = { ...console, log: jest.fn() };
```

### Run Single Test with Verbose Output
```bash
npm test -- tests/api/jobs.test.js --verbose
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest tests/api/jobs.test.js
```

## 🔍 CI/CD Integration

Tests can be integrated into GitHub Actions, GitLab CI, or other CI/CD pipelines:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Update this README if adding new test categories
