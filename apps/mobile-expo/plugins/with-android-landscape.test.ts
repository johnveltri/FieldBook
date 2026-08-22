const {
  setMainActivityOrientationUnspecified,
} = require('./with-android-landscape');

describe('withAndroidLandscape', () => {
  it('allows MainActivity to use the Android system orientation', () => {
    const manifest = {
      manifest: {
        application: [
          {
            $: { 'android:name': '.MainApplication' },
            activity: [
              {
                $: {
                  'android:name': '.MainActivity',
                  'android:screenOrientation': 'portrait',
                },
              },
            ],
          },
        ],
      },
    };

    setMainActivityOrientationUnspecified(manifest);

    expect(manifest.manifest.application[0].activity[0].$['android:screenOrientation']).toBe(
      'unspecified',
    );
  });
});
