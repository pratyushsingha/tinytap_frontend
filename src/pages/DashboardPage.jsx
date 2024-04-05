import { useContext, useEffect, useState } from 'react';
import {
  Container,
  Input,
  Button,
  AppContext,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  InputDiv,
  Separator,
  QrDialog,
  Switch,
  Spinner
} from '@/components/Index';
import axios from 'axios';
import moment from 'moment';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const shortUrlSchema = z.object({
  url: z
    .string()
    .nonempty("URL can't be empty")
    .url({ message: 'Invalid URL' }),
  expiredIn: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined))
});

const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const { progress, setProgress, generateQrCode, qrcode } =
    useContext(AppContext);
  const [urls, setUrls] = useState([]);
  const [isExpirationTime, setIsExpirationTime] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      url: '',
      expiredIn: ''
    },
    resolver: zodResolver(shortUrlSchema)
  });

  const userUrls = async () => {
    setLoading(true);
    setProgress(progress + 30);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/url/my`,
        { withCredentials: true }
      );
      // console.log(response.data.data.urls);
      setUrls(response.data.data.urls);
      setLoading(false);
      setProgress(progress + 100);
    } catch (error) {
      console.log(error);
      setLoading(false);
      setProgress(progress + 100);
    }
  };

  const deleteUrl = async (urlId) => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/url/remove/${urlId}`,
        { withCredentials: true }
      );
      // console.log(response);
      setUrls(urls.filter((url) => url._id !== urlId));
    } catch (error) {
      console.log(error);
    }
  };

  const shortUrl = async ({ url, expiredIn }) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/url/short`,
        { originalUrl: url, expiredIn },
        { withCredentials: true }
      );

      // setShortenedUrl(response.data.data);
      // console.log(response.data);
      setLoading(false);
      console.log(url, expiredIn);
      // alert('shortened');
      setUrls([...urls, response.data.data]);
      setOpenDialog(false);
    } catch (error) {
      console.error('Error shortening URL:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    userUrls();
  }, [setUrls]);

  return (
    <Container className="sm:col-span-10">
      <div className="flex justify-between">
        <Input placeholder="search..." className="w-1/3" />
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="hover:bg-green-400">Create</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(shortUrl)}>
              <div className="grid gap-4 py-4">
                <InputDiv
                  label="Destination URL"
                  placeholder="This Should Be A Very Long URL..."
                  {...register('url', {
                    required: true
                  })}
                />
                <p>{errors.url?.message}</p>
                <div className="flex justify-center items-center space-x-3 my-2">
                  <Separator className="w-32" />
                  <span className="text-white">optional</span>
                  <Separator className="w-32" />
                </div>
                <div className="flex justify-between">
                  <p>Expiration Date</p>
                  <Switch
                    defaultChecked={isExpirationTime}
                    onCheckedChange={() => {
                      setIsExpirationTime((prev) => !prev);
                    }}
                  />
                </div>
                {isExpirationTime === true && (
                  <input
                    className="bg-black"
                    type="date"
                    {...register('expiredIn')}
                  />
                )}
              </div>
              <DialogFooter>
                <Button disabled={isSubmitting} type="submit">
                  {loading && <Spinner />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {urls.length > 0 ? (
        urls.map((url) => (
          <div key={url._id} className="bg-[#1C1917] rounded-lg p-3 my-3">
            <div className="flex justify-between">
              <a href={`${url.shortenUrl}`} target="_blank">
                <div className="flex mx-3">
                  <img
                    className="h-8 w-8 rounded-full self-center mr-2"
                    src={url.logo}
                    alt={url.originalUrl}
                  />
                  <div className="">
                    <p className="flex justify-start font-bold">
                      {url.shortenUrl}
                    </p>
                    <p className="text-sm flex justify-start">
                      {url?.originalUrl?.slice(0, 30)}...
                    </p>
                  </div>
                </div>
              </a>
              <div className="flex space-x-5">
                <div className="space-y-1">
                  <p className="text-sm">{moment(url.expiredIn).format('L')}</p>
                  <p className="text-xs text-center">expires at</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-sm">{moment(url.createdAt).format('L')}</p>
                  <p className="text-xs text-center">created at</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      <svg
                        width={15}
                        height={15}
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z"
                          fill="currentColor"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuGroup>
                      <a
                        href={url.shortenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <DropdownMenuItem className="cursor-pointer">
                          Analytics
                        </DropdownMenuItem>
                      </a>
                      <DropdownMenuItem
                        onClick={() =>
                          window.navigator.clipboard.writeText(url.shortenUrl)
                        }
                        className="cursor-pointer"
                      >
                        Copy{' '}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              onClick={() => generateQrCode(url._id)}
                            >
                              QrCode
                            </button>
                          </DialogTrigger>
                          <QrDialog
                            shortenedUrl={url.shortenUrl}
                            qrcode={qrcode}
                          />
                        </Dialog>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 cursor-pointer"
                        onClick={() => deleteUrl(url._id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))
      ) : loading ? (
        <div className="my-3 text-center">
          <Spinner />
        </div>
      ) : (
        <p className="my-3 text-center">No urls found</p>
      )}
    </Container>
  );
};

export default DashboardPage;
